export interface IAst {
    src?: ISrcLoc
}

export interface ISrcLoc {
    file: string | null
    line: number
    col: number
}

export interface IAstAttribute extends IAst {
    name: string
    parameters: IAstParameter[]
}

export interface IAstParameter extends IAst {
    name: string | null
    value: IAstLiteral | IAstIdentifier
}

export interface IAstDesign extends IAst {
    imports: IAstImport[]
    modules: IAstModule[]
}

export interface IAstImport extends IAst {
    'import': string
    'from': string
}

export interface IAstModule extends IAst {
    attributes: IAstAttribute[]
    exported: boolean
    declaration: boolean
    name: string
    statements: AstStatement[]
}

// Statements
export type AstStatement = IAstDeclaration | IAstAssignment |
    IAstFullyQualifiedName

export interface IAstDeclaration extends IAst {
    attributes: IAstAttribute[]
    identifier: IAstIdentifier
    'type': IAstType
}

export interface IAstAssignment extends IAst {
    lhs: AstExpr
    rhs: AstExpr
}

export interface IAstFullyQualifiedName extends IAst {
    attributes: IAstAttribute[]
    fqn: string[]
}

export interface IAstType extends IAst {
    ty: AstType
    width: number
    signed: boolean
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
    cellType: string
    width: number
    parameters: IAstParameter[]
    assignments: IAstAssignment[]
}
