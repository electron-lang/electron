import { ISrcLoc, emptySrcLoc } from '../../diagnostic'
import { Literal, ASTLiteralPattern, matchASTLiteral } from './literal'
import { Decl, IModule, IParam, IPort } from './declaration'

export type Expr = Literal | IRef<Decl> | ITuple | IRange | IBinOp | IInst

export interface ASTExprPattern<T> extends ASTLiteralPattern<T> {
    Ref: (ref: IRef<Decl>) => T
    Tuple: (tuple: ITuple) => T
    Range: (range: IRange) => T
    BinOp: (op: IBinOp) => T
    Inst: (inst: IInst) => T
}

export function matchASTExpr<T>(p: ASTExprPattern<T>): (expr: Expr) => T {
    return (expr: Expr): T => {
        switch(expr.tag) {
            case 'ref':
                return p.Ref(expr)
            case 'range':
                return p.Range(expr)
            case 'tuple':
                return p.Tuple(expr)
            case 'inst':
                return p.Inst(expr)
            case 'binop':
                return p.BinOp(expr)
            default:
                return matchASTLiteral(p)(expr)
        }
    }
}

/* Reference */
export interface IRef<T> {
    tag: 'ref'
    ref: T
    src: ISrcLoc
}

export function Ref<T>(ref: T, src?: ISrcLoc): IRef<T> {
    return {
        tag: 'ref',
        ref,
        src: src || emptySrcLoc,
    }
}
/* Reference */

/* Tuple */
export interface ITuple {
    tag: 'tuple'
    exprs: Expr[]
    src: ISrcLoc
}

export function Tuple(exprs: Expr[], src?: ISrcLoc): ITuple {
    return {
        tag: 'tuple',
        exprs,
        src: src || emptySrcLoc,
    }
}
/* Tuple */

/* Indexing */
export interface IRange {
    tag: 'range'
    expr: Expr
    start: Expr
    end: Expr
    src: ISrcLoc
}

export function Range(expr: Expr, start: Expr, end?: Expr,
                      src?: ISrcLoc): IRange {
    return {
        tag: 'range',
        expr,
        start,
        end: end || start,
        src: src || emptySrcLoc,
    }
}
/* Indexing */

/* Operators */
export type BinOp = '+' | '-' | '*' | '<<' | '>>'
export interface IBinOp {
    tag: 'binop'
    op: BinOp
    lhs: Expr
    rhs: Expr
    src: ISrcLoc
}

export function BinOp(op: BinOp, lhs: Expr, rhs: Expr, src?: ISrcLoc): IBinOp {
    return {
        tag: 'binop',
        op,
        lhs,
        rhs,
        src: src || emptySrcLoc,
    }
}
/* Operators */

/* Instances */
export interface IInst {
    tag: 'inst'
    mod: IRef<IModule>
    params: [IRef<IParam>, Expr][]
    conns: [IRef<IPort>, Expr][]
    src: ISrcLoc
}

export function Inst(mod: IRef<IModule>,
                     params: [IRef<IParam>, Expr][],
                     conns: [IRef<IPort>, Expr][],
                     src?: ISrcLoc): IInst {
    return {
        tag: 'inst',
        mod,
        params,
        conns,
        src: src || emptySrcLoc,
    }
}
/* Instances */
