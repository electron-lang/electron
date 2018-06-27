import * as ast from './ast'
import { matchASTExpr } from './ast';
import { DiagnosticPublisher, throwBug } from './diagnostic'
import { SymbolTable, IScope } from './symbolTable'
import { allTypeHandlers } from './parameters';

export type Declarable = ast.IParamDecl | ast.IConst | ast.IPort | ast.INet | ast.ICell

export class TypeChecker {
    private st: SymbolTable<Declarable>;

    constructor(private logger: DiagnosticPublisher) {
        this.st = new SymbolTable(this.logger)
    }

    reset() {
        this.st = new SymbolTable(this.logger)
    }

    typeError(expr: ast.Expr, expect: string, found: string): boolean {
        this.logger.error(`Type error: Expected type '${expect}', ` +
                          `but found type '${found}'.`, expr.src)
        return false
    }

    enterScope(name?: string) {
        this.st.enterScope(name)
    }

    exitScope(): IScope<Declarable> {
        return this.st.exitScope()
    }

    defineModuleElements(mod: ast.IModule) {
        for (let p of mod.params) {
            this.define(p.name, p)
        }
        for (let c of mod.consts) {
            this.define(c.ident, c)
        }
        for (let p of mod.ports) {
            this.define(p.ident, p)
        }
        for (let n of mod.nets) {
            this.define(n.ident, n)
        }
        for (let c of mod.cells) {
            this.define(c.ident, c)
        }
    }

    defineModule(mod: ast.IModule): IScope<Declarable> {
        this.enterScope(mod.name)
        for (let p of mod.params) {
            this.define(p.name, p)
        }
        for (let p of mod.ports) {
            this.define(p.ident, p)
        }
        return this.exitScope()
    }

    define(ident: ast.IIdent, decl: Declarable) {
        this.st.define(ident, decl)
    }

    lookup(sym: ast.IIdent) {
        return this.st.lookup(sym)
    }

    checkModInst(inst: ast.IModInst) {
        for (let param of inst.params) {
            const pdecl = (() => {
                if (typeof param.name === 'number') {
                    return inst.module.params[param.name]
                } else {
                    const name = param.name
                    for (let pdecl of inst.module.params) {
                        if (param.name.id === pdecl.name.id) {
                            return pdecl
                        }
                    }
                }
            })()

            if (pdecl) {
                this.checkParam(pdecl, param)
            } else {
                const text = (param.name as any).id || param.name.toString()
                this.logger.error(
                    `Module '${inst.module.name}' doesn't have ` +
                        `parameter '${text}'.`,
                    (param.name as any).src || param.value.src)
            }
        }

        let scope: string | IScope<Declarable> = inst.module.name
        if (inst.module.anonymous) {
            scope = this.defineModule(inst.module)
        }
        for (let entry of inst.dict.entries) {
            for (let entry of inst.dict.entries) {
                this.st.enterScope(scope)
                const decl = this.lookup(entry.ident)
                this.exitScope()
                if (decl) {
                    if (decl.tag === 'port') {
                        this.checkConn(decl, entry.expr)
                    } else {
                        throwBug('moduleInstantiation')
                    }
                } else {
                    this.checkIsSignal(entry.expr)
                }
            }
        }
    }

    checkParam(pdecl: ast.IParamDecl, param: ast.IParam) {
        if (pdecl.ty.id === 'Integer') {
            this.checkIsInteger(param.value)
            return
        }

        if (param.value.tag === 'ident') {
            let pdecl2 = this.lookup(param.value)
            if (!pdecl2) return
            if (pdecl2.tag === 'param-decl') {
                if (pdecl2.ty.id !== pdecl.ty.id) {
                    this.typeError(param.value, pdecl.ty.id, pdecl2.ty.id)
                    return
                }
                return
            }
        }

        if (!allTypeHandlers[pdecl.ty.id].isValid(param.value)) {
            this.typeError(param.value, pdecl.ty.id, param.value.tag)
        }
    }

    checkConn(port: ast.IPort, expr: ast.Expr) {
        this.checkIsSignal(expr)
    }

    checkAssign(assign: ast.IAssign) {
        let ident
        if (assign.lhs.tag === 'ref') {
            ident = assign.lhs.ident
        } else if (assign.lhs.tag === 'ident') {
            ident = assign.lhs
        }
        if (ident) {
            const decl = this.lookup(ident)
            if (decl) {
                switch(decl.tag) {
                    case 'const':
                        return this.checkIsInteger(assign.rhs)
                    case 'net':
                        return this.checkIsSignal(assign.rhs)
                    case 'port':
                        return this.checkIsSignal(assign.rhs)
                    case 'cell':
                        return this.checkIsCell(assign.rhs)
                }
            }
        } else {
            this.logger.error(`Only assignments to an Ident or Ref are ` +
                              `supported.`, assign.lhs.src)
        }
    }

    checkIsInteger(expr: ast.Expr): boolean {
        const error = (found: string) => {
            return (e: ast.Expr) =>  this.typeError(e, 'Integer', found)
        }
        return matchASTExpr({
            Integer: (e) => true,
            String: error('String'),
            BitVector: error('BitVector'),
            Unit: error('Unit'),
            Real: error('Real'),
            Bool: error('Bool'),
            Tuple: error('Tuple'),
            Ident: (e) => {
                const decl = this.st.lookup(e)
                if (!decl) return false
                switch(decl.tag) {
                    case 'const':
                        return true
                    case 'param-decl':
                        if (decl.ty.id === 'Integer') {
                            return true
                        }
                        return error(decl.ty.id)(e)
                    case 'cell':
                        return error('Cell')(e)
                    default:
                        return error('Signal')(e)
                }
            },
            Ref: (e) => {
                if (this.checkIsInteger(e.ident)) {
                    this.logger.error(`Integer type doesn't support ` +
                                      `indexing.`, e.src)
                }
                return false
            },
            ModInst: error('Cell'),
            BinOp: (e) => {
                return this.checkIsInteger(e.lhs) &&
                    this.checkIsInteger(e.rhs)
            }
        })(expr)
    }

    checkIsCell(expr: ast.Expr): boolean {
        const error = (found: string) => {
            return (e: ast.Expr) =>  this.typeError(e, 'Cell', found)
        }
        return matchASTExpr({
            Integer: error('Integer'),
            String: error('String'),
            BitVector: error('BitVector'),
            Unit: error('Unit'),
            Real: error('Real'),
            Bool: error('Bool'),
            Tuple: error('Tuple'),
            Ident: (e) => {
                const decl = this.st.lookup(e)
                if (!decl) return false
                switch(decl.tag) {
                    case 'cell':
                        return true
                    case 'param-decl':
                        return error('ParamDecl')(e)
                    case 'const':
                        return error('Integer')(e)
                    default:
                        return error('Signal')(e)
                }
            },
            Ref: (e) => {
                if (this.checkIsCell(e.ident)) {
                    this.logger.error(`Cell type doesn't support ` +
                                      `indexing.`, e.src)
                }
                return false
            },
            ModInst: (e) => true,
            BinOp: (e) => {
                if (this.checkIsCell(e.lhs) && this.checkIsCell(e.rhs)) {
                    this.logger.error(`Cell type doesn't support '${e.op}'.`,
                                      e.src)
                }
                return false
            }
        })(expr)
    }

    checkIsSignal(expr: ast.Expr): boolean {
        const error = (found: string) => {
            return (e: ast.Expr) =>  this.typeError(e, 'Signal', found)
        }
        return matchASTExpr({
            Integer: error('Integer'),
            String: error('String'),
            BitVector: (e) => true,
            Unit: error('Unit'),
            Real: error('Real'),
            Bool: error('Bool'),
            Tuple: (e) => true,
            Ident: (e) => {
                const decl = this.st.lookup(e)
                if (!decl) return false
                switch(decl.tag) {
                    case 'port':
                    case 'net':
                        return true
                    case 'param-decl':
                        return error('ParamDecl')(e)
                    case 'const':
                        return error('Integer')(e)
                    case 'cell':
                        return error('Cell')(e)
                }
            },
            Ref: (e) => {
                return this.checkIsSignal(e.ident)
            },
            ModInst: error('ModInst'),
            BinOp: (e) => {
                return this.checkIsSignal(e.lhs) &&
                    this.checkIsSignal(e.rhs)
            }
        })(expr)
    }
}
