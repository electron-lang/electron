import * as ast from '../ast'
import * as ir from '../backend/ir'
import { DiagnosticPublisher } from '../diagnostic'
import { SymbolTable } from '../symbolTable'
import { matchASTExpr } from '../ast';

type Value = number | string | boolean | ir.IBitVec | ir.ICell | ir.IRef
    | ir.IConcat | ir.ICell[] | ir.INet | ir.IPort

export class ASTCompiler {
    private st: SymbolTable<Value>

    constructor(private logger: DiagnosticPublisher) {
        this.st = new SymbolTable(logger)
    }

    compile(design: ast.IDesign): ir.IModule[] {
        let modules: ir.IModule[] = []
        for (let mod of design.modules) {
            if (mod.exported && mod.params.length === 0) {
                modules = modules.concat(this.compileModule(mod, []))
            }
        }
        return modules
    }

    compileModule(mod: ast.IModule, params: ast.IParam[]): ir.IModule[] {
        const irmod = ir.Module(mod.name)

        for (let param of params) {
            // No longer has numeric name
            // Resolved by type checker
            const name = (param as any).name
            this.st.define(name, this.evalExpr(param.value))
        }

        for (let cell of mod.cells) {
            const width = this.evalExpr(cell.width) as number
            let cells = []
            if (width > 1) {
                for (let i = 0; i < width; i++) {
                    cells.push(ir.Cell(cell.ident.id + '$' + i.toString()))
                }
            } else {
                this.st.define(cell.ident, ir.Cell(cell.ident.id))
            }
        }

        for (let port of mod.ports) {
            const p = ir.Port(port.ident.id, port.ty,
                              this.evalExpr(port.width) as number,
                              port.ident.src)
            this.st.define(port.ident, p)
        }

        for (let net of mod.nets) {
            const n = ir.Net(net.ident.id, this.evalExpr(net.width) as number,
                             net.ident.src)
            this.st.define(net.ident, n)
        }

        for (let assign of mod.assigns) {
            //assign.lhs
        }

        return []
    }

    evalExpr(expr: ast.Expr): Value {
        return 0 /*matchASTExpr({
            Tuple: t => this.evalTuple(t),
            Ident: i => this.st.lookup(i),
            Ref: r => this.evalRef(r),
            ModInst: inst => inst,
            BinOp: op => this.evalBinOp(op),
            Integer: n => n.value,
            String: str => str.value,
            BitVector: bv => bv,
            Unit: u => u.value * 10 ** u.exp,
            Real: r => r.value,
            Bool: b => b.value,
        })(expr)*/
    }

    evalTuple(t: ast.ITuple): ir.IConcat {
        return ir.Concat(t.exprs.map(this.evalExpr) as any)
    }

    evalRef(ref: ast.IRef): ir.IRef {
        return ir.Ref(this.st.lookup(ref.ident) as any, // should never fail
                      this.evalExpr(ref.from) as number,
                      this.evalExpr(ref.to) as number)
    }

    evalBinOp(op: ast.IBinOp): Value {
        const lhs = this.evalExpr(op.lhs) as number
        const rhs = this.evalExpr(op.rhs) as number

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
