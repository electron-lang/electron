import * as ast from './ast'
import * as ir from '../backend/ir'
import { FileInfo } from '../file'
import { Logger } from '../diagnostic'
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
            val: bits.map((bit) => ir.Sig.create(bit))
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
    protected logger: Logger
    private st: SymbolTable<WrappedValue>
    private mods: ir.IModule[] = []

    constructor(readonly info: FileInfo) {
        this.logger = info.logger
        this.st = new SymbolTable(info)
        ir.Sig.resetCounter()
    }

    compile(mods: ast.IModule[]): ir.IModule[] {
        this.mods = []
        for (let mod of mods) {
            if (mod.params.length === 0) {
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
                sigs.push(ir.Sig.create())
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
                const name = width > 1 ? cell.name + '$' + i.toString() : cell.name
                const ircell = ir.Cell(name, ir.Module('', []), [], [],
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
        if (mod.declaration) {
            irmod.attrs.push(ir.Attr('declare', true))
        }

        const cellRefs: ir.IRef<ir.ICell>[] = []
        const stmts = mod.anonymous || mod.declaration ? mod.ports : mod.stmts
        for (let stmt of stmts) {
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

                    if (c2.module.name === '') {
                        c2.module.name = c1.name + '$mod'
                    }

                    lhs.val[i].ref = ir.Cell(c1.name, c2.module, c2.params,
                                             c2.assigns, c1.attrs, c1.src)
                }
            } else {
                this.logger.bug('evalAssign1')
            }
        } else if (lhs.tag === 'sigs' && rhs.tag === 'sigs') {
            if (lhs.val.length === rhs.val.length) {
                for (let i = 0; i < lhs.val.length; i++) {
                    lhs.val[i] = rhs.val[i]
                }
            } else {
                this.logger.bug('evalAssign2')
            }
        } else if (lhs.tag === 'param' && rhs.tag === 'param') {
            lhs.val = rhs.val
        } else {
            this.logger.bug('evalAssign3')
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
            Xml: x => wrapParam(x.value),
        })(expr)
    }

    evalRef(ref: ast.IRef<ast.Decl>): WrappedValue {
        const val = this.st.lookup(Symbol(ref.ref.name, ref.ref.src))
        if (val === null) {
            this.logger.bug(ref.ref.name + ' not found.')
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

        this.mods.push(irmod)

        const ircell = ir.Cell('', irmod, params, assigns, [], inst.src)

        return wrapCell([ir.Ref(ircell, 0)])
    }

    evalTuple(t: ast.ITuple): WrappedValue {
        return wrapSig([].concat.apply([], t.exprs.map((e) => {
            return unwrap(this.evalExpr(e))
        }) as ir.ISig[][]))
    }

    evalRange(range: ast.IRange): WrappedValue {
        const val = this.evalExpr(range.expr)
        const sigs = unwrap(val) as (ir.ISig | ir.IRef<ir.ICell>)[]
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

        const newSigs: (ir.ISig | ir.IRef<ir.ICell>)[] = []
        for (let i = start; i < end + 1; i++) {
            newSigs.push(sigs[i])
        }
        if (val.tag === 'sigs') {
            return wrapSig(newSigs as ir.ISig[])
        } else if (val.tag === 'cells') {
            return wrapCell(newSigs as ir.IRef<ir.ICell>[])
        } else {
            return wrapSig([ ir.Sig.create() ])
        }
    }

    evalBitVector(bv: ast.IBitVector): WrappedValue {
        return wrapSig(bv.value.map((bit) => ir.Sig.create(bit)))
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
