import { FileInfo } from '../file'
import { Logger } from '../diagnostic';
import * as ast from './ast'
import { matchASTExpr } from './ast';
import { allTypeHandlers } from './parameters'

export class TypeChecker {
    protected logger: Logger

    constructor(file: FileInfo) {
        this.logger = file.logger
    }

    typeError(expr: ast.Expr, expect: string, found: string): boolean {
        this.logger.error(`Type error: Expected type '${expect}', ` +
                          `but found type '${found}'.`, expr.src)
        return false
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
            Xml: error('Xml'),
            Ref: (e) => {
                switch(e.ref.tag) {
                    case 'const':
                        return true
                    case 'param':
                        if (e.ref.ty === 'Integer') {
                            return true
                        }
                        return error(e.ref.ty)(e)
                    case 'cell':
                        return error('Cell')(e)
                    default:
                        return error('Signal')(e)
                }
            },
            Range: (e) => {
                if (this.checkIsInteger(e.expr)) {
                    this.logger.error(`Integer type doesn't support ` +
                                      `indexing.`, e.src)
                }
                return false
            },
            Inst: error('Cell'),
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
            Xml: error('Xml'),
            Ref: (e) => {
                switch(e.ref.tag) {
                    case 'cell':
                        return true
                    case 'param':
                        return error('Param')(e)
                    case 'const':
                        return error('Integer')(e)
                    default:
                        return error('Signal')(e)
                }
            },
            Range: (e) => {
                if (this.checkIsCell(e.expr)) {
                    this.logger.error(`Cell type doesn't support ` +
                                      `indexing.`, e.src)
                }
                return false
            },
            Inst: (e) => true,
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
            Xml: error('Xml'),
            Tuple: (e) => true,
            Ref: (e) => {
                switch(e.ref.tag) {
                    case 'port':
                    case 'net':
                        return true
                    case 'module':
                        return error('Module')(e)
                    case 'param':
                        if (e.ref.ty !== 'BitVector') {
                            return error('Param')(e)
                        }
                        return true
                    case 'const':
                        return error('Integer')(e)
                    case 'cell':
                        return error('Cell')(e)
                }
            },
            Range: (e) => {
                return this.checkIsSignal(e.expr)
            },
            Inst: error('Inst'),
            BinOp: (e) => {
                return this.checkIsSignal(e.lhs) &&
                    this.checkIsSignal(e.rhs)
            }
        })(expr)
    }

    checkParam(param: ast.IParam, expr: ast.Expr) {
        if (param.ty === 'Integer') {
            this.checkIsInteger(expr)
            return
        }

        if (expr.tag === 'ref') {
            if (expr.ref.tag === 'param') {
                if (expr.ref.ty !== param.ty) {
                    this.typeError(expr, param.ty, expr.ref.ty)
                    return
                }
                return
            }
        }

        if (!allTypeHandlers[param.ty].isValid(expr)) {
            this.typeError(expr, param.ty, expr.tag)
        }
    }

    checkAssign(assign: ast.IAssign) {
        const decl = this.typeOfLhs(assign.lhs)
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
                case 'module':
                case 'param':
                    this.logger.bug('checkAssign')
            }
        }
    }

    typeOfLhs(lhs: ast.Expr): ast.Decl | null {
        if (lhs.tag === 'ref') {
            return lhs.ref
        }
        if (lhs.tag === 'range' && lhs.expr.tag === 'ref') {
            return lhs.expr.ref
        }

        this.logger.error(`Only assignments to an Ident or Ref are ` +
                          `supported.`, lhs.src)
        return null
    }
}
