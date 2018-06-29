import { ISrcLoc, emptySrcLoc } from '../../diagnostic'
import { IAttr } from './attribute'
import { Ref, IRef, Expr } from './expression'
import { Decl, IParam, IPort, matchASTDecl, ASTDeclPattern } from './declaration'

export type Ast = IAttr | Stmt | Expr
export type Stmt = Decl | IAssign

export interface ASTStmtPattern<T> extends ASTDeclPattern<T> {
    Assign: (assign: IAssign) => T
}

export function matchASTStmt<T>(p: ASTStmtPattern<T>): (stmt: Stmt) => T {
    return (stmt: Stmt): T => {
        switch(stmt.tag) {
            case 'assign':
                return p.Assign(stmt)
            default:
                return matchASTDecl(p)(stmt)
        }
    }
}

export interface IAssign {
    tag: 'assign'
    lhs: Expr
    rhs: Expr
}

export function Assign(lhs: Expr, rhs: Expr): IAssign {
    return {
        tag: 'assign',
        lhs,
        rhs,
    }
}
