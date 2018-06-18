import { ISrcLoc } from './diagnostic'

export interface IAst {
    src?: ISrcLoc
}

export interface IAstSymbol {
    identifier: IAstIdentifier
}

export interface IAstAttribute extends IAst {
    name: IAstIdentifier
    parameters: IAstParameter[]
}

export interface IAstParameter extends IAst {
    name: IAstIdentifier | null
    value: IAstLiteral | IAstIdentifier
}

export interface IAstDesign extends IAst {
    imports: IAstImport[]
    modules: IAstModule[]
}

export interface IAstImport extends IAstSymbol {
    package: IAstLiteral
}

export interface IAstModule extends IAstSymbol {
    attributes: IAstAttribute[]
    exported: boolean
    declaration: boolean
    statements: AstStatement[]
}

// Statements
export type AstStatement = IAstDeclaration | IAstAssignment |
    IAstFullyQualifiedName

export interface IAstDeclaration extends IAstSymbol {
    attributes: IAstAttribute[]
    'type': IAstType
}

export interface IAstAssignment extends IAst {
    lhs: AstExpr
    rhs: AstExpr
}

export interface IAstFullyQualifiedName extends IAst {
    attributes: IAstAttribute[]
    fqn: IAstIdentifier[]
}

export interface IAstType extends IAst {
    ty: AstType
    width: number
}

export enum AstType {
    Input = 'input',
    Output = 'output',
    Inout = 'inout',
    Analog = 'analog',
    Net = 'net',
    Cell = 'cell',
}

// Expressions
export type AstExpr = IAstLiteral | IAstIdentifier | IAstReference |
    IAstConcat | IAstCell

export interface IAstLiteral extends IAst {
    value: any,
    literalType: AstLiteralType,
}

export enum AstLiteralType {
    Constant,
    Integer,
    Unit,
    String,
}

export interface IAstIdentifier extends IAst {
    id: string
}

export interface IAstReference extends IAst {
    identifier: IAstIdentifier
    'from': number
    to: number
}

export interface IAstConcat extends IAst {
    expressions: AstExpr[]
}

export interface IAstCell extends IAst {
    cellType: IAstIdentifier
    width: number
    parameters: IAstParameter[]
    assignments: IAstAssignment[]
}
