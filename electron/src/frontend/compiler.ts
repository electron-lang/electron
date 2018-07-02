import * as ast from './ast'
import * as ir from '../backend/ir'
import { DiagnosticPublisher } from '../diagnostic'
import { SymbolTable, Symbol } from './symbolTable'
import { matchASTStmt, matchASTExpr } from './ast'
import { allAttributes } from './attributes'

interface ISigWrapper {
    tag: 'sigs'
    val: ir.ISig[]
}

function wrapSig(val: ir.ISig[]): ISigWrapper {
    return {
        tag: 'sigs',
        val,
    }
}

interface ICellWrapper {
    tag: 'cells'
    val: ir.IRef<ir.ICell>[]
}

function wrapCell(val: ir.IRef<ir.ICell>[]): ICellWrapper {
    return {
        tag: 'cells',
        val,
    }
}

interface IParamWrapper {
    tag: 'param'
    val: number | string | boolean
}

function wrapParam(val: number | string | boolean | ir.Bit[]): IParamWrapper | ISigWrapper {
    if ((val as ir.Bit[]).length) {
        const bits = val as ir.Bit[]
        return {
            tag: 'sigs',
            val: bits.map((bit) => ir.Sig(bit))
        }
    } else {
        const param = val as number | string | boolean
        return {
            tag: 'param',
            val: param,
        }
    }
}

type WrappedValue = IParamWrapper | ISigWrapper | ICellWrapper
type Value = number | string | boolean | ir.ISig[] | ir.IRef<ir.ICell>[]

function unwrap(val: WrappedValue): Value {
    return val.val
}

interface ValuePattern<T> {
    Number: (num: number) => T
    String: (str: string) => T
    Bool: (bool: boolean) => T
    Sig: (sigs: ir.ISig[]) => T
    Cell: (cells: ir.IRef<ir.ICell>[]) => T
}

function matchValue<T>(p: ValuePattern<T>): (val: WrappedValue) => T {
    return (val: WrappedValue) => {
        if (val.tag === 'param') {
            if (typeof val.val === 'number') {
                return p.Number(val.val)
            }
            if (typeof val.val === 'string') {
                return p.String(val.val)
            }
            if (typeof val.val === 'boolean') {
                return p.Bool(val.val)
            }
        }
        if (val.tag === 'sigs') {
            return p.Sig(val.val)
        }
        if (val.tag === 'cells') {
            return p.Cell(val.val)
        }
        return p.Number(0)
    }
}

function unwrapParam(val: WrappedValue): number | string | boolean | ir.Bit[] {
    const valueToBits = (sigs: ir.ISig[]): ir.Bit[] => {
        const bits: ir.Bit[] = []
        for (let sig of sigs) {
            bits.push(sig.value as ir.Bit)
        }
        return bits
    }

    return matchValue<number | string | boolean | ir.Bit[]>({
        Number: (num) => num,
        String: (str) => str,
        Bool: (bool) => bool,
        Sig: (sig) => valueToBits(sig),
        Cell: (cell) => []
    })(val)
}

function compileAttrs(attrs: ast.IAttr[]): ir.IAttr[] {
    const irattrs = []
    for (let attr of attrs) {
        for (let irattr of allAttributes[attr.name].compile(attr)) {
            irattrs.push(irattr)
        }
    }
    return irattrs
}

export class ASTCompiler {
    private st: SymbolTable<WrappedValue>;
    private mods: ir.IModule[] = []

    constructor(private logger: DiagnosticPublisher) {
        this.st = new SymbolTable(logger)
    }

    compile(mods: ast.IModule[]): ir.IModule[] {
        this.mods = []
        for (let mod of mods) {
            if (mod.params.length === 0 && !mod.declaration) {
                this.mods.push(this.compileModule(mod, []))
            }
        }
        return this.mods
    }

    define(decl: ast.IPort | ast.INet): ir.ISig[] {
        const width = unwrap(this.evalExpr(decl.width)) as number
        const sigs = (() => {
            let sigs: ir.ISig[] = []
            for (let i = 0; i < width; i++) {
                sigs.push(ir.Sig())
            }
            return sigs
        })()
        this.st.define(Symbol(decl.name, decl.src), wrapSig(sigs))
        return sigs
    }

    defineCell(cell: ast.ICell): ir.IRef<ir.ICell>[] {
        const width = unwrap(this.evalExpr(cell.width)) as number
        const cells = (() => {
            let cells: ir.IRef<ir.ICell>[] = []
            for (let i = 0; i < width; i++) {
                const ircell = ir.Cell(cell.name, ir.Module('', []), [], [],
                                       compileAttrs(cell.attrs), cell.src)
                cells.push(ir.Ref(ircell, 0))
            }
            return cells
        })()
        this.st.define(Symbol(cell.name, cell.src), wrapCell(cells))
        return cells
    }

    compileModule(mod: ast.IModule,
                  params: ir.IParam[]): ir.IModule {
        this.st.enterScope()
        const irmod = ir.Module(mod.name, compileAttrs(mod.attrs), mod.src)
        for (let param of params) {
            this.st.define(Symbol(param.name, param.src), wrapParam(param.value))
        }

        const cellRefs: ir.IRef<ir.ICell>[] = []
        for (let stmt of mod.stmts) {
            matchASTStmt({
                Module: (mod) => {},
                Param: (p) => {},
                Const: (c) => {
                    this.st.define(Symbol(c.name, c.src), wrapParam(0))
                },
                Port: (port) => {
                    const sigs = this.define(port)
                    const irport = ir.Port(port.name, port.ty, sigs,
                                           compileAttrs(port.attrs), port.src)
                    irmod.ports.push(irport)
                },
                Net: (net) => {
                    const sigs = this.define(net)
                    const irnet = ir.Net(net.name, sigs, compileAttrs(net.attrs),
                                         net.src)
                    irmod.nets.push(irnet)
                },
                Cell: (cell) => {
                    const refs = this.defineCell(cell)
                    for (let ref of refs) {
                        cellRefs.push(ref)
                    }
                },
                Assign: (a) => this.evalAssign(a)
            })(stmt)
        }

        irmod.cells = cellRefs.map((ref) => ref.ref)

        this.st.exitScope()
        return irmod
    }

    evalAssign(assign: ast.IAssign) {
        const lhs = this.evalExpr(assign.lhs)
        const rhs = this.evalExpr(assign.rhs)
        if (lhs.tag === 'cells' && rhs.tag === 'cells') {
            if (lhs.val.length === rhs.val.length) {
                for (let i = 0; i < lhs.val.length; i++) {
                    const c1 = lhs.val[i].ref
                    const c2 = rhs.val[i].ref
                    lhs.val[i].ref = ir.Cell(c1.name, c2.module, c2.params,
                                             c2.assigns, c1.attrs, c1.src)
                }
            }
        } else if (lhs.tag === 'sigs' && rhs.tag === 'sigs') {
            if (lhs.val.length === rhs.val.length) {
                for (let i = 0; i < lhs.val.length; i++) {
                    lhs.val[i] = rhs.val[i]
                }
            }
        } else if (lhs.tag === 'param' && rhs.tag === 'param') {
            lhs.val = rhs.val
        } else {
            console.log(lhs, rhs)
        }
    }

    evalExpr(expr: ast.Expr): WrappedValue {
        return matchASTExpr<WrappedValue>({
            Tuple: tuple => this.evalTuple(tuple),
            Ref: ref => this.evalRef(ref),
            Range: range => this.evalRange(range),
            Inst: inst => this.evalInst(inst),
            BinOp: op => this.evalBinOp(op),
            Integer: n => wrapParam(n.value),
            String: str => wrapParam(str.value),
            BitVector: bv => this.evalBitVector(bv),
            Unit: u => wrapParam(u.value),
            Real: r => wrapParam(r.value),
            Bool: b => wrapParam(b.value),
        })(expr)
    }

    evalRef(ref: ast.IRef<ast.Decl>): WrappedValue {
        const val = this.st.lookup(Symbol(ref.ref.name, ref.ref.src))
        if (val === null) {
            return wrapParam(0)
        }
        return val
    }

    evalInst(inst: ast.IInst): WrappedValue {
        const params = []
        for (let [paramRef, expr] of inst.params) {
            const p = this.evalExpr(expr)
            const val = unwrapParam(p)
            params.push(ir.Param(paramRef.ref.name, val, paramRef.ref.src))
        }

        const irmod = this.compileModule(inst.mod.ref, params)

        const assigns: ir.IAssign[] = []
        for (let [portRef, expr] of inst.conns) {
            const sigs = this.evalExpr(expr)
            for (let p of irmod.ports) {
                if (p.name === portRef.ref.name) {
                    assigns.push(ir.Assign(ir.Ref(p, 0),
                                           unwrap(sigs) as ir.ISig[],
                                           portRef.src))
                }
            }
        }

        const ircellmod = (() => {
            if (inst.mod.ref.declaration) {
                return inst.mod.ref.name
            }
            return irmod
        })()
        const ircell = ir.Cell('', ircellmod, params, assigns, [], inst.src)

        return wrapCell([ir.Ref(ircell, 0)])
    }

    evalTuple(t: ast.ITuple): WrappedValue {
        return wrapSig([].concat.apply([], t.exprs.map((e) => {
            return unwrap(this.evalExpr(e))
        }) as ir.ISig[][]))
    }

    evalRange(range: ast.IRange): WrappedValue {
        const sigs = unwrap(this.evalExpr(range.expr)) as ir.ISig[]
        const start = unwrap(this.evalExpr(range.start)) as number
        const end = unwrap(this.evalExpr(range.end)) as number
        if (start > end) {
            this.logger.error(`Start index '${start}' is larger ` +
                              `than end index '${end}.'`, range.src)
        }
        if (start < 0) {
            this.logger.error(`Start index '${start}' out of bounds.`, range.src)
        }
        if (end > sigs.length - 1) {
            this.logger.error(`End index '${end}' out of bounds.`, range.src)
        }
        const newSigs: ir.ISig[] = []
        for (let i = start; i < end; i++) {
            newSigs.push(sigs[i])
        }
        return wrapSig(newSigs)
    }

    evalBitVector(bv: ast.IBitVector): WrappedValue {
        return wrapSig(bv.value.map((bit) => ir.Sig(bit)))
    }

    evalBinOp(op: ast.IBinOp): WrappedValue {
        const lhs = unwrap(this.evalExpr(op.lhs)) as number
        const rhs = unwrap(this.evalExpr(op.rhs)) as number

        return wrapParam((() => {
            switch (op.op) {
                case '+':
                    return lhs + rhs
                case '-':
                    return lhs - rhs
                case '*':
                    return lhs - rhs
                case '<<':
                    return lhs << rhs
                case '>>':
                    return lhs >> rhs
            }
        })())
    }
}

/*
    compileModule(mod: ast.IModule) {
        let irmod = ir.Module(mod.name)
        irmod.src = mod.src || emptySrcLoc
        this.ir.push(irmod)

        this.symbolTable.declareSymbol(mod.name, irmod)
        this.symbolTable.enterScope(mod.name)

        irmod.attrs = this.compileAttrs(mod.attrs)

        this.validateParamDecls(mod.params)

        for (let c of mod.consts) {
            this.validateConst(c)
        }

        for (let p of mod.ports) {
            this.validatePort(p)
        }

        for (let n of mod.nets) {
            this.validateNet(n)
        }

        for (let c of mod.cells) {
            this.validateCell(c)
        }

        for (let assign of mod.assigns) {
            this.validateAssign(assign)
        }

        this.symbolTable.exitScope()
    }

    compileAttrs(attrs: ast.IAttr[]): ir.IAttr[] {
        let irattrs = []
        for (let attr of attrs) {
            const attrHandler = allAttributes[attr.name.id]
            for (let irattr of attrHandler.compile(attr)) {
                irattrs.push(irattr)
            }
        }
        return irattrs
    }

    validateIdentifier(ident: ast.IIdent): Declarable | null {
        let irdecl = this.symbolTable.resolveSymbol(ident.id)
        if (!irdecl) {
            this.logger.error(`Unknown symbol '${ident.id}'`, ident.src)
        }
        return irdecl
    }

    validateSetAttr(setAttrs: ast.ISetAttr) {
        let irattrs = this.validateAttributes(setAttrs.attrs)
        for (let stmt of setAttrs.stmts) {
            this.validateStmt(stmt)
            if (stmt.tag in ['port', 'net', 'cell', 'const']) {
                let irdecl = this.symbolTable.resolveSymbol(stmt.name)
                if (irdecl && irdecl.tag !== 'param') {
                    for (let irattr of irattrs) {
                        irdecl.attrs.push(irattr)
                    }
                }
            }
        }
        for (let fqn of setAttrs.fqns) {
            let irdecl = this.validateFQN(fqn)

            if (irdecl && irdecl.tag !== 'param') {
                for (let irattr of irattrs) {
                    irdecl.attrs.push(irattr)
                }
            }
        }
    }

    validateConst(c: ast.IConst) {

    }

    validatePort(port: ast.IPort) {

    }

    validateNet(net: ast.INet) {

    }

    validateCell(cell: ast.ICell) {

    }

    validateAssign(assign: ast.IAssign) {
        //this.validateExpression(assign.lhs)
        //this.validateExpression(assign.rhs)
        //this.checkTypesEqual(lhsTy, rhsTy, assign.lhs.src || emptySrcLoc)
    }

    evalExpr(expr: ast.Expr): ast.Expr[] {
        return ast.matchASTExpr({
            Integer: (ast) => [ast],
            String: (ast) => [ast],
            Real: (ast) => [ast],
            Unit: (ast) => [ast],
            Bool: (ast) => [ast],
            BitVector: (ast) => [ast],
            Ident: (ast) => [ast],
            Ref: this.evaluateRef,
            Tuple: this.evaluateTuple,
            ModInst: this.evalModInst,
            BinOp: this.evaluateBinOp,
        })(expr)
    }

    evaluateRef(ref: ast.IRef): ast.Expr[] {
        return []//this.evalIdent(ref.ident)

        if (!(ref.from < sig.width && ref.to < sig.width)) {
            this.errors.push({
                message: `Out of bounds access of '${ref.identifier.id}'.`,
                src: ref.src || emptySrcLoc,
                severity: DiagnosticSeverity.Error,
                errorType: DiagnosticType.TypeCheckingError,
            })
        }

        let width = ref.to - ref.from + 1
        if (width < 1) {
            this.errors.push({
                message: `Reversed bounds on '${ref.identifier.id}'.`,
                src: ref.src || emptySrcLoc,
                severity: DiagnosticSeverity.Error,
                errorType: DiagnosticType.TypeCheckingError,
            })
        }
    }

    evaluateTuple(tuple: ast.ITuple): ast.Expr[] {
        return [].concat.apply([], tuple.exprs.map(this.evalExpr))
    }

    evalModInst(cell: ast.IModInst): ast.Expr[] {
        return []
        let mod = this.symbolTable.resolveSymbol(cell.module)

        if (mod) {
            for (let param of cell.parameters) {
                let pdecl = null
                if (param.identifier.id.startsWith('__')) {
                    const i = parseInt(param.identifier.id.substring(2))
                    pdecl = mod.parameters[i - 1]
                } else {
                    for (let modpdecl of mod.parameters) {
                        if (param.identifier.id === modpdecl.identifier.id) {
                            pdecl = modpdecl
                        }
                    }
                }
                if (!pdecl) {
                    this.logger.error(
                        `Module '${mod.identifier.id}' doesn't have ` +
                            `parameter '${param.identifier.id}'.`,
                        param.identifier.src || param.value.src)
                }

                // TODO const eval param.value
                // allTypeHandlers[pdecl.identifier.id].isValid()
            }

            // Only enter scope once to avoid multiple error messages
            this.symbolTable.enterScope(cell.module)
            for (let entry of cell.dict.entries) {
                // TODO check lhs and rhs type match
                let lhsTy = this.validateIdentifier(entry.identifier)

                // Check that assignment is to a port
                // Make sure unresolved symbol error only gets emitted once
                if (lhsTy.width) {
                    let decl = this.symbolTable.resolveDeclaration(entry.identifier)
                    if (decl && decl.declType === AstDeclType.Net) {
                        this.logger.error(`Illegal assignment to internal net ` +
                                `'${decl.identifier.id}' in '${cell.module.id}'.`,
                            entry.identifier.src)
                    }
                }
            }
            this.symbolTable.exitScope()
        }

        for (let entry of cell.dict.entries) {
            this.validateExpression(entry.expr)
        }
    }

    validateDict(mod: ast.IModule, dict: ast.IDict) {
        // Only enter scope once to avoid multiple error messages
        this.symbolTable.enterScope(mod.name)
        for (let entry of dict.entries) {
            // TODO check lhs and rhs type match
            let lhsTy = this.validateIdentifier(entry.ident)

            // Check that assignment is to a port
            // Make sure unresolved symbol error only gets emitted once
            if (lhsTy.width) {
                let decl = this.symbolTable.resolveDeclaration(entry.identifier)
                if (decl && decl.declType === AstDeclType.Net) {
                    this.logger.error(
                        `Illegal assignment to internal net ` +
                            `'${decl.identifier.id}' in '${mod.identifier.id}'.`,
                        entry.identifier.src)
                }
            }
        }
        this.symbolTable.exitScope()

        for (let entry of dict.entries) {
            this.evalExpr(entry.expr)
        }
    }

}*/

        /*if (assign.lhs.tag === 'range' && assign.lhs.expr.tag === 'ref') {
            const range = assign.lhs
            const decl = assign.lhs.expr.ref
            switch(decl.tag) {
                case 'cell':
                    /*const cell = this.st.lookup(Symbol(a.lhs.expr.ref.name))
                      if (cell && cell.tag === 'ref' && cell.ref.length) {
                      cell.ref[this.evalExpr(a.lhs.start)] = this.evalExpr(a.rhs)
                      }
                    break
                case 'port':
                case 'net':
                    break
            }
        }
        if (a.lhs.tag === 'ref') {
            const decl = a.lhs.ref
            switch(decl.tag) {
                case 'cell':
                    /*
                      const cell = this.st.lookup(Symbol(a.lhs.expr.ref.name))
                      if (cell) {
                      cell = this.evalExpr(a.rhs)
                      }
                case 'port':
                case 'net':
                    const value = this.st.lookup(Symbol(decl.name, decl.src))
                    if (value !== null) {
                        matchValue({
                            Number: (num) => null,
                            String: (str) => null,
                            Bool: (bool) => null,
                            Sig: (sigs) => {
                                if (sigs.length !== )
                                    }
                        })(value)
                    }
                    break

            }
        }*/
