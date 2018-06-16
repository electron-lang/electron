import { parserInstance, parse } from './parser'
import { IAstAssignment, IAstAttribute, IAstCell, IAstConcat, IAstDeclaration,
         IAstDesign, IAstFullyQualifiedName, IAstIdentifier, IAstImport,
         IAstLiteral, IAstModule, IAstParameter, IAstReference, IAstType,
         AstType, AstLiteralType, AstExpr, AstStatement } from './ast'

const BaseElectronVisitor = parserInstance.getBaseCstVisitorConstructor()

function parseString(text: string): string {
    return text.substring(1, text.length - 1)
}

function parseAttribute(name: string): string {
    return name.substring(1)
}

function parseSymbol(symbol: string): string {
    return symbol.substring(1)
}

function parseInteger(int: string): number {
    return parseInt(int)
}

class ElectronToAstVisitor extends BaseElectronVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    design(ctx: any): IAstDesign {
        let imports = new Array()
        let modules = []

        if (ctx.importStatement) {
            ctx.importStatement.forEach((ctx: any) => {
                imports = imports.concat(this.visit(ctx))
            })
        }

        if (ctx.moduleStatement) {
            modules = ctx.moduleStatement.map((ctx: any) => this.visit(ctx))
        }

        return {
            imports,
            modules,
        }
    }

    importStatement(ctx: any): IAstImport[] {
        const from_ = parseString(ctx.String[0].image)
        return ctx.Identifier.map((id: any) => {
            return {
                'import': id.image,
                'from': from_
            }
        })
    }

    moduleStatement(ctx: any): IAstModule {
        let attributes = []
        if (ctx.attribute) {
            attributes = ctx.attribute.map((ctx: any) => this.visit(ctx))
        }
        let statements = []
        if (ctx.statement) {
            const stmts = ctx.statement.map((ctx: any) => this.visit(ctx))
            statements = [].concat.apply([], stmts)
        }
        return {
            attributes,
            exported: !!ctx.Export,
            declaration: !!ctx.Declare,
            name: ctx.Identifier[0].image,
            statements
        }
    }

    parameterLiteral(ctx: any): IAstLiteral {
        if (ctx.Constant) {
            return {
                value: ctx.Constant[0].image,
                literalType: AstLiteralType.Constant,
            }
        } else if (ctx.Integer) {
            return {
                value: parseInteger(ctx.Integer[0].image),
                literalType: AstLiteralType.Integer,
            }
        } else if (ctx.Symbol) {
            return {
                value: parseSymbol(ctx.Symbol[0].image),
                literalType: AstLiteralType.Symbol,
            }
        } else {
            return {
                value: parseString(ctx.String[0].image),
                literalType: AstLiteralType.String,
            }
        }
    }

    signalLiteral(ctx: any): IAstLiteral {
        return {
            value: ctx.Constant[0].image,
            literalType: AstLiteralType.Constant,
        }
    }

    identifier(ctx: any): IAstIdentifier {
        if (ctx.Symbol) {
            return {
                id: parseSymbol(ctx.Symbol[0].image),
            }
        } else {
            return {
                id: ctx.Identifier[0].image,
            }
        }
    }

    typeExpression(ctx: any): IAstType {
        let width = 1
        let ty = AstType.Net
        if (ctx.Net) {
            ty = AstType.Net
        } else if (ctx.Input) {
            ty = AstType.Input
        } else if (ctx.Output) {
            ty = AstType.Output
        } else if (ctx.Inout) {
            ty = AstType.Inout
        } else if (ctx.Analog) {
            ty = AstType.Analog
        } else {
            ty = AstType.Cell
        }

        return {
            width: this.visit(ctx.width),
            signed: false, // TODO
            ty,
        }
    }

    attribute(ctx: any): IAstAttribute {
        return {
            name: parseAttribute(ctx.Attribute[0].image),
            parameters: this.visit(ctx.parameterList),
        }
    }

    declaration(ctx: any): AstStatement[] {
        const ty = this.visit(ctx.typeExpression[0])
        const lhs = ctx.identifier.map((ctx: any) => this.visit(ctx))
        const declarations = lhs.map((identifier: IAstIdentifier) => {
            return {
                attributes: [],
                identifier,
                'type': ty,
            }
        })

        let assignments = new Array()
        if (ctx.rhs) {
            const rhs = this.visit(ctx.rhs[0])

            if (lhs.length != rhs.length) {
                throw Error('Unbalanced assignment')
            }

            for (let i = 0; i < rhs.length; i++) {
                assignments.push({
                    lhs: lhs[i],
                    rhs: rhs[i],
                })
            }
        }

        return declarations.concat(assignments)
    }

    statement(ctx: any): AstStatement[] {
        let attributes = new Array()
        if (ctx.attribute) {
            attributes = ctx.attribute.map((ctx: any) => this.visit(ctx))
        }

        let statements = new Array()

        if (ctx.fullyQualifiedName) {
            const stmt = this.visit(ctx.fullyQualifiedName[0])
            stmt.attributes = stmt.attributes.concat(attributes)
            return [ stmt ]
        }

        if (ctx.assignment) {
            return this.visit(ctx.assignment[0])
        }

        if (ctx.declaration) {
            const stmts = this.visit(ctx.declaration[0])
            return stmts.map((stmt: AstStatement) => {
                if ((stmt as IAstDeclaration).identifier) {
                    let decl = stmt as IAstDeclaration
                    decl.attributes = decl.attributes.concat(attributes)
                }
                return stmt
            })
        }

        return []
    }

    fullyQualifiedName(ctx: any): AstStatement {
        const fqn = ctx.identifier.map((ctx: any) => this.visit(ctx).id)
        return {
            attributes: [],
            fqn
        }
    }

    assignment(ctx: any): AstStatement[] {
        const lhs = this.visit(ctx.lhs[0])
        const rhs = this.visit(ctx.rhs[0])

        if(rhs.length != lhs.length) {
            throw Error('Unbalanced assignment')
        }

        let assignments = new Array()
        for (let i = 0; i < rhs.length; i++) {
            assignments.push({
                lhs: lhs[i],
                rhs: rhs[i],
            })
        }
        return assignments
    }

    lhs(ctx: any): AstExpr[] {
        return ctx.expression.map((ctx: any) => {
            return this.visit(ctx)
        })
    }

    rhs(ctx: any): AstExpr[] {
        return ctx.expression.map((ctx: any) => {
            return this.visit(ctx)
        })
    }

    expression(ctx: any): AstExpr {
        if (ctx.signalLiteral) {
            return this.visit(ctx.signalLiteral)
        } else if (ctx.referenceExpression) {
            return this.visit(ctx.referenceExpression)
        } else if (ctx.concatExpression) {
            return this.visit(ctx.concatExpression)
        } else if (ctx.cellExpression) {
            return this.visit(ctx.cellExpression)
        } else {
            throw new Error('Missing expression type')
        }
    }

    concatExpression(ctx: any): AstExpr {
        return {
            expressions: ctx.expression.map((ctx: any) => this.visit(ctx)),
        }
    }

    referenceExpression(ctx: any): AstExpr {
        if (!ctx.Integer) {
            return this.visit(ctx.identifier)
        }
        let from_ = parseInteger(ctx.Integer[0].image)
        let to = from_
        if (ctx.Integer[1]) {
            to = parseInteger(ctx.Integer[1].image)
        }
        return {
            identifier: this.visit(ctx.identifier),
            'from': from_,
            to,
        }
    }

    width(ctx: any): number {
        if (ctx.Integer) {
            return parseInteger(ctx.Integer[0].image)
        }
        return 1
    }

    cellExpression(ctx: any): AstExpr {
        let parameters = []
        if (ctx.parameterList) {
            parameters = this.visit(ctx.parameterList)
        }
        let assignments = []
        if (ctx.connection) {
            assignments = ctx.connection.map((ctx: any) => this.visit(ctx))
        }
        return {
            cellType: ctx.CellType[0].image,
            width: this.visit(ctx.width),
            parameters,
            assignments,
        }
    }

    parameterList(ctx: any): IAstParameter[] {
        return ctx.parameter.map((ctx: any) => this.visit(ctx))
    }

    parameter(ctx: any): IAstParameter {
        let name = null
        if (ctx.Identifier) {
            name = ctx.Identifier[0].image
        }
        return {
            name,
            value: this.visit(ctx.parameterLiteral),
        }
    }

    connection(ctx: any): IAstAssignment {
        const lhs = this.visit(ctx.identifier[0])
        const rhs = ctx.expression ? this.visit(ctx.expression[0]) : lhs
        return {
            lhs,
            rhs,
        }
    }
}

export const toAstVisitorInstance = new ElectronToAstVisitor()

export function toAst(text: string): IAstDesign {
    const cst = parse(text);
    return toAstVisitorInstance.visit(cst)
}
