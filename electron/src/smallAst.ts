import { ISrcLoc } from './diagnostic'

export enum SmallAst {
    Module,
    Identifier,
    Attribute,
    Param,
    Assign,
    Decl,
    Constant,
    Concat,
    Ref,
    Cell,
}

export interface ISmallAst {
    sast: SmallAst
    src?: ISrcLoc
}

export interface IModule extends ISmallAst {
    sast: SmallAst.Module
    attributes: IAttribute[]
    identifier: IIdentifier
    statements: Stmt[]
}

export interface IIdentifier extends ISmallAst {
    sast: SmallAst.Identifier
    id: string
}

export interface IAttribute extends ISmallAst {
    ast: SmallAst.Attribute
    name: IIdentifier
    parameters: IParam[]
}

export interface IParam extends ISmallAst {
    ast: SmallAst.Param
    name: IIdentifier
    value: string
}

// Statements
export type Stmt = IDecl | IAssign

export interface IAssign extends ISmallAst {
    sast: SmallAst.Assign
    lhs: Expr
    rhs: Expr
}

export interface IDecl extends ISmallAst {
    ast: SmallAst.Decl
    attributes: IAttribute[],
    declType: AstDeclType
    width: number
    identifier: IIdentifier
}

export enum AstDeclType {
    Net = 'net',
    Input = 'input',
    Output = 'output',
    Inout = 'inout',
    Analog = 'analog',
}

// Expressions
export type Expr = IConstant | IConcat | IRef

export interface ISmallExpr extends ISmallAst {
}

export interface IConstant extends ISmallExpr {
    ast: SmallAst.Constant
    value: Bit[]
}

export enum Bit {
    Zero, One, Z, X,
}

export interface IConcat extends ISmallExpr {
    ast: SmallAst.Concat
    exprs: Expr[]
}

export interface IRef extends ISmallExpr {
    ast: SmallAst.Ref
    identifier: IIdentifier
    from: number
    to: number
}

export interface ICell extends ISmallAst {
    ast: SmallAst.Cell
    module: IIdentifier
    attributes: IAttribute[]
    parameters: IParam[]
    assigns: IAssign[]
}
