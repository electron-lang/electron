import { ISrcLoc } from './diagnostic'

export enum Ast {
    Design,
    Import,
    Module,
    Identifier,
    FQN,
    Attribute,
    ParamDecl,
    Param,
    SetAttributes,
    With,
    Assign,
    ApplyDict,
    Decl,
    Literal,
    BinOp,
    Tuple,
    Dict,
    DictEntry,
    Ref,
    AnonymousMod,
    ModInst,
}

export interface IAst {
    ast: Ast
    src?: ISrcLoc
}

export interface IAstDesign extends IAst {
    ast: Ast.Design
    imports: IAstImport[]
    modules: IAstModule[]
}

export interface IAstImport extends IAst {
    ast: Ast.Import
    identifiers: IAstIdentifier[]
    package: string
}

export interface IAstModule extends IAst {
    ast: Ast.Module
    attributes: IAstAttribute[]
    exported: boolean
    declaration: boolean
    identifier: IAstIdentifier
    parameters: IAstParamDecl[]
    statements: AstStmt[]
}

export interface IAstIdentifier extends IAst {
    ast: Ast.Identifier
    id: string
}

export interface IAstFQN extends IAst {
    ast: Ast.FQN
    fqn: IAstIdentifier[]
}

export interface IAstAttribute extends IAst {
    ast: Ast.Attribute
    name: IAstIdentifier
    parameters: IAstParam[]
}

export interface IAstParamDecl extends IAst {
    ast: Ast.ParamDecl
    name: IAstIdentifier | null
    ty: IAstIdentifier
}

export interface IAstParam extends IAst {
    ast: Ast.Param
    name: IAstIdentifier | null
    value: AstExpr
}

// Statements
export type AstStmt = IAstAttributeStmt | IAstDeclStmt
    | IAstWithStmt | IAstAssignStmt | IAstApplyDictStmt

export interface IAstAttributeStmt extends IAst {
    ast: Ast.SetAttributes
    attributes: IAstAttribute[]
    statements: AstStmt[]
    fqns: IAstFQN[]
}

export interface IAstWithStmt extends IAst {
    ast: Ast.With
    scope: IAstFQN
    statements: AstStmt[]
}

export interface IAstAssignStmt extends IAst {
    ast: Ast.Assign
    lhs: AstExpr
    rhs: AstExpr
}

export interface IAstApplyDictStmt extends IAst {
    ast: Ast.ApplyDict
    expr: AstExpr
    dict: IAstDict
}

export interface IAstDeclStmt extends IAst {
    ast: Ast.Decl
    attributes: IAstAttribute[],
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
    ast: Ast.Literal
    value: string
    litType: AstLiteralType
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
    ast: Ast.BinOp
    op: AstBinaryOp
    lhs: AstExpr
    rhs: AstExpr
}

export interface IAstTuple extends IAstExpr {
    ast: Ast.Tuple
    expressions: AstExpr[]
}

// not an expression
export interface IAstDict extends IAst {
    ast: Ast.Dict
    entries: IAstDictEntry[]
    star: boolean
}

export interface IAstDictEntry extends IAst {
    ast: Ast.DictEntry
    identifier: IAstIdentifier
    expr: AstExpr
}

export interface IAstReference extends IAstExpr {
    ast: Ast.Ref
    identifier: IAstIdentifier
    from: AstExpr
    to: AstExpr
}

export interface IAstAnonymousModule extends IAst {
    ast: Ast.AnonymousMod
    statements: AstStmt[]
}

export interface IAstModInst extends IAst {
    ast: Ast.ModInst
    module: IAstIdentifier
    parameters: IAstParam[]
    width: AstExpr
    dict: IAstDict
}
