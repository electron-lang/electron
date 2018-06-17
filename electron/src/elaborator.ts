import { parserInstance, parse } from './parser'
import { IAstAssignment, IAstAttribute, IAstCell, IAstConcat, IAstDeclaration,
         IAstDesign, IAstFullyQualifiedName, IAstIdentifier, IAstImport,
         IAstLiteral, IAstModule, IAstParameter, IAstReference, IAstType,
         AstType, AstLiteralType, AstExpr, AstStatement } from './ast'
import { IDiagnostic, DiagnosticType, DiagnosticSeverity,
         ISrcLoc, tokenToSrcLoc } from './diagnostic';

const BaseElectronVisitor = parserInstance.getBaseCstVisitorConstructor()

function parseString(text: string): string {
    return text.substring(1, text.length - 1)
}

function parseAttribute(name: string): string {
    return name.substring(1)
}

function parseInteger(int: string): number {
    return parseInt(int)
}

function throwBug(rule: string): void {
    throw new Error('Programming Error: Parser/Elaborator missmatch ' +
                    `at rule '${rule}'.\n` +
                    'Please report the bug at https://github.com/electron-lang/electron')
}

class ElectronElaborationVisitor extends BaseElectronVisitor {
    public errors: IDiagnostic[] = []

    constructor() {
        super()
        this.validateVisitor()
    }

    design(ctx: any): IAstDesign {
        // reset errors
        this.errors = []

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
        return ctx.identifier.map((identifier: any) => {
            return {
                'import': this.visit(identifier),
                'from': {
                    value: from_,
                    literalType: AstLiteralType.String,
                    src: tokenToSrcLoc(ctx.String[0])
                }
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
            name: this.visit(ctx.identifier),
            statements
        }
    }

    identifier(ctx: any): IAstIdentifier {
        return {
            src: tokenToSrcLoc(ctx.Identifier[0]),
            id: ctx.Identifier[0].image,
        }
    }

    // Attributes
    attribute(ctx: any): IAstAttribute {
        return {
            name: {
                id: parseAttribute(ctx.Attribute[0].image),
                src: tokenToSrcLoc(ctx.Attribute[0]),
            },
            parameters: this.visit(ctx.parameterList),
        }
    }

    parameterList(ctx: any): IAstParameter[] {
        if (ctx.parameter) {
            return ctx.parameter.map((ctx: any) => this.visit(ctx))
        }
        return []
    }

    parameter(ctx: any): IAstParameter {
        let name = null
        if (ctx.identifier) {
            name = this.visit(ctx.identifier)
        }
        return {
            name,
            value: this.visit(ctx.parameterLiteral),
        }
    }

    parameterLiteral(ctx: any): any {
        let expr = null
        if (ctx.Constant) {
            expr = {
                value: ctx.Constant[0].image,
                literalType: AstLiteralType.Constant,
                src: tokenToSrcLoc(ctx.Constant[0]),
            }
        } else if (ctx.Integer) {
            expr = {
                value: parseInteger(ctx.Integer[0].image),
                literalType: AstLiteralType.Integer,
                src: tokenToSrcLoc(ctx.Integer[0]),
            }
        } else if (ctx.Unit) {
            expr = {
                value: ctx.Unit[0].image,
                literalType: AstLiteralType.Unit,
                src: tokenToSrcLoc(ctx.Unit[0]),
            }
        } else if (ctx.String) {
            expr = {
                value: parseString(ctx.String[0].image),
                literalType: AstLiteralType.String,
                src: tokenToSrcLoc(ctx.String[0]),
            }
        } else if (ctx.identifier) {
            expr = this.visit(ctx.identifier)
        } else {
            throwBug('parameterLiteral')
        }
        return expr
    }

    // Statements
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
        const fqn = ctx.identifier.map((ctx: any) => this.visit(ctx))
        return {
            attributes: [],
            fqn
        }
    }

    assignment(ctx: any): AstStatement[] {
        const lhs = this.visit(ctx.lhs[0])
        const rhs = this.visit(ctx.rhs[0])

        if(rhs.length != lhs.length) {
            this.errors.push({
                message: 'Unbalanced assignment',
                src: {
                    startLine: 0,
                    startColumn: 0,
                    endLine: 0,
                    endColumn: 0,
                },
                severity: DiagnosticSeverity.Error,
                errorType: DiagnosticType.SyntaxError,
            })
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
                this.errors.push({
                    message: 'Unbalanced assignment',
                    src: {
                        startLine: 0,
                        startColumn: 0,
                        endLine: 0,
                        endColumn: 0,
                    },
                    severity: DiagnosticSeverity.Error,
                    errorType: DiagnosticType.SyntaxError,
                })
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
        } else if (ctx.Cell) {
            ty = AstType.Cell
        } else {
            throwBug('typeExpression')
        }

        return {
            width: this.visit(ctx.width),
            signed: false, // TODO
            ty,
        }
    }

    width(ctx: any): number {
        if (ctx.Integer) {
            return parseInteger(ctx.Integer[0].image)
        }
        return 1
    }

    // Expressions
    expression(ctx: any): AstExpr {
        let expr = null
        if (ctx.signalLiteral) {
            expr = this.visit(ctx.signalLiteral)
        } else if (ctx.concatExpression) {
            expr = this.visit(ctx.concatExpression)
        } else if (ctx.identifier) {
            let identifier = this.visit(ctx.identifier)
            if (ctx.referenceExpression) {
                let ref = this.visit(ctx.referenceExpression)
                ref.identifier = identifier
                expr = ref
            } else if (ctx.cellExpression) {
                let cell = this.visit(ctx.cellExpression)
                cell.cellType = identifier
                expr = cell
            } else {
                expr = identifier
            }
        } else {
            throwBug('expression')
        }
        return expr
    }

    signalLiteral(ctx: any): IAstLiteral {
        return {
            value: ctx.Constant[0].image,
            literalType: AstLiteralType.Constant,
        }
    }

    concatExpression(ctx: any): IAstConcat {
        return {
            expressions: ctx.expression.map((ctx: any) => this.visit(ctx)),
        }
    }

    referenceExpression(ctx: any): IAstReference {
        let from_ = parseInteger(ctx.Integer[0].image)
        let to = from_
        if (ctx.Integer[1]) {
            to = parseInteger(ctx.Integer[1].image)
        }
        return {
            identifier: { id: '' },
            'from': from_,
            to,
        }
    }

    cellExpression(ctx: any): IAstCell {
        let cell = this.visit(ctx.cellBody)

        if (ctx.width) {
            cell.width = this.visit(ctx.width)
        }
        if (ctx.parameterList) {
            cell.parameters = this.visit(ctx.parameterList)
        }

        return cell
    }

    cellBody(ctx: any): IAstCell {
        let assignments = []
        if (ctx.connection) {
            assignments = ctx.connection.map((ctx: any) => this.visit(ctx))
        }
        return {
            cellType: { id: '' },
            width: 1,
            parameters: [],
            assignments,
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

export const elaboratorInstance = new ElectronElaborationVisitor()

export function elaborate(text: string): IAstDesign {
    const cst = parse(text);
    const design = elaboratorInstance.visit(cst)
    if (elaboratorInstance.errors.length > 0) {
        throw new Error(elaboratorInstance.errors[0].message)
    }
    return design
}
