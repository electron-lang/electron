import { ISrcLoc } from './diagnostic'

export interface IAst {
    src?: ISrcLoc
}

export interface IAstDesign extends IAst {
    imports: IAstImport[]
    modules: IAstModule[]
}

export interface IAstImport extends IAst {
    identifiers: IAstIdentifier[]
    package: string
}

export interface IAstModule extends IAst {
    attributes: IAstAttribute[]
    exported: boolean
    declaration: boolean
    identifier: IAstIdentifier
    parameters: IAstParamDecl[]
    statements: AstStmt[]
}

export interface IAstIdentifier extends IAst {
    id: string
}

export interface IAstFQN extends IAst {
    fqn: IAstIdentifier[]
}

export interface IAstAttribute extends IAst {
    name: IAstIdentifier
    parameters: IAstParam[]
}

export interface IAstParamDecl extends IAst {
    name: IAstIdentifier | null
    ty: IAstIdentifier
}

export interface IAstParam extends IAst {
    name: IAstIdentifier | null
    value: AstExpr
}

// Statements
export type AstStmt = IAstAttributeStmt | IAstDeclStmt
    | IAstWithStmt | IAstAssignStmt | IAstApplyDictStmt

export interface IAstAttributeStmt extends IAst {
    attributes: IAstAttribute[]
    statements: AstStmt[]
}

export interface IAstWithStmt extends IAst {
    scope: IAstFQN
    statements: AstStmt[]
}

export interface IAstAssignStmt extends IAst {
    lhs: AstExpr
    rhs: AstExpr
}

export interface IAstApplyDictStmt extends IAst {
    expr: AstExpr
    dict: IAstDict
}

export interface IAstDeclStmt extends IAst {
    declType: AstDeclType
    width: AstExpr
    identifier: IAstIdentifier
}

export enum AstDeclType {
    Net = 'net',
    Input = 'input',
    Output = 'output',
    Inout = 'inout',
    Analog = 'analog',
    Cell = 'cell',
    Const = 'const',
}

// Expressions
export type AstExpr = IAstLiteral | IAstTuple | IAstAnonymousModule
    | IAstIdentifier | IAstReference | IAstModInst | IAstBinOp

export enum ExprType {
    SignalExpr,
    ConstantExpr,
    CellExpr,
}

export interface IAstExpr extends IAst {
    ty?: ExprType
}

export interface IAstLiteral extends IAstExpr {
    value: string,
    litType: AstLiteralType,
}

export enum AstLiteralType {
    Integer,
    Constant,
    Unit,
    String,
    Real,
    Boolean,
}

export enum AstBinaryOp {
    Add,
    Sub,
    Mul,
    Shl,
    Shr,
}

export interface IAstBinOp extends IAstExpr {
    op: AstBinaryOp
    lhs: AstExpr
    rhs: AstExpr
}

export interface IAstTuple extends IAstExpr {
    expressions: AstExpr[]
}

// not an expression
export interface IAstDict extends IAst {
    entries: IAstDictEntry[]
    star: boolean
}

export interface IAstDictEntry extends IAst {
    identifier: IAstIdentifier,
    expr: AstExpr,
}

export interface IAstReference extends IAstExpr {
    identifier: IAstIdentifier
    from: AstExpr
    to: AstExpr
}

export interface IAstAnonymousModule extends IAst {
    statements: AstStmt[]
}

export interface IAstModInst extends IAst {
    module: IAstIdentifier
    parameters: IAstParam[]
    width: AstExpr
    dict: IAstDict
}
