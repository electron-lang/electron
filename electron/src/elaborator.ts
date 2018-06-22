import { lexerInstance, parserInstance } from './parser'
import { IAstAssignStmt, IAstAttribute, IAstModInst, IAstTuple, IAstDeclStmt,
         IAstDesign, IAstFQN, IAstIdentifier, IAstImport, IAstLiteral,
         IAstModule, IAstParam, IAstReference, AstLiteralType,
         Ast, AstExpr, AstStmt, IAstParamDecl, IAstAttributeStmt, IAstWithStmt,
         IAstDict, AstDeclType, AstBinaryOp, IAstDictEntry, IAstAnonymousModule,
         IAstApplyDictStmt } from './ast'
import { IDiagnostic, DiagnosticSeverity,
         ISrcLoc, tokenToSrcLoc, IAstResult } from './diagnostic'

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
    public paramCounter: number = 0

    constructor() {
        super()
        this.validateVisitor()
    }

    design(ctx: any): IAstDesign {
        // reset state
        this.errors = []

        let imports = []
        let modules = []

        if (ctx.moduleImport) {
            imports = ctx.moduleImport.map((ctx: any) => this.visit(ctx))
        }

        if (ctx.moduleDeclaration) {
            modules = ctx.moduleDeclaration.map((ctx: any) => this.visit(ctx))
        }

        return {
            ast: Ast.Design,
            imports,
            modules,
        }
    }

    moduleImport(ctx: any): IAstImport {
        return {
            ast: Ast.Import,
            src: tokenToSrcLoc(ctx.String[0]),
            identifiers: this.visit(ctx.identifiers),
            package: parseString(ctx.String[0].image)
        }
    }

    moduleDeclaration(ctx: any): IAstModule {
        let mod: IAstModule = {
            ast: Ast.Module,
            attributes: [],
            exported: !!ctx.Export,
            declaration: !!ctx.Declare,
            identifier: this.visit(ctx.identifier),
            parameters: [],
            statements: [],
        }
        if (ctx.attribute) {
            mod.attributes = ctx.attribute.map((ctx: any) => this.visit(ctx))
        }

        if (ctx.parameterDeclarationList) {
            mod.parameters = this.visit(ctx.parameterDeclarationList[0])
        }

        if (ctx.statements) {
            mod.statements = this.visit(ctx.statements[0])
        }

        return mod
    }

    identifier(ctx: any): IAstIdentifier {
        return {
            ast: Ast.Identifier,
            src: tokenToSrcLoc(ctx.Identifier[0]),
            id: ctx.Identifier[0].image,
        }
    }

    identifiers(ctx: any): IAstIdentifier[] {
        return ctx.identifier.map((ctx: any) => this.visit(ctx))
    }

    fullyQualifiedName(ctx: any): IAstFQN {
        return {
            ast: Ast.FQN,
            fqn: ctx.identifier.map((ctx: any) => this.visit(ctx))
        }
    }

    fullyQualifiedNames(ctx: any): IAstFQN[] {
        return ctx.fullyQualifiedName.map((ctx: any) => this.visit(ctx))
    }

    // Attributes
    attribute(ctx: any): IAstAttribute {
        return {
            ast: Ast.Attribute,
            name: {
                ast: Ast.Identifier,
                id: parseAttribute(ctx.Attribute[0].image),
                src: tokenToSrcLoc(ctx.Attribute[0]),
            },
            parameters: this.visit(ctx.parameterList),
        }
    }

    parameterDeclarationList(ctx: any): IAstParamDecl[] {
        this.paramCounter = 0
        if (ctx.parameterDeclaration) {
            return ctx.parameterDeclaration.map((ctx: any) => this.visit(ctx))
        }
        return []
    }

    parameterDeclaration(ctx: any): IAstParamDecl {
        if (ctx.identifier.length > 1) {
            return {
                ast: Ast.ParamDecl,
                identifier: this.visit(ctx.identifier[0]),
                ty: this.visit(ctx.identifier[1]),
            }
        }
        this.paramCounter += 1
        return {
            ast: Ast.ParamDecl,
            identifier: {
                ast: Ast.Identifier,
                id: '__' + this.paramCounter.toString(),
            },
            ty: this.visit(ctx.identifier[0]),
        }
    }

    parameterList(ctx: any): IAstParam[] {
        this.paramCounter = 0
        if (ctx.parameter) {
            return ctx.parameter.map((ctx: any) => this.visit(ctx))
        }
        return []
    }

    parameter(ctx: any): IAstParam {
        if (ctx.expression.length > 1) {
            return {
                ast: Ast.Param,
                identifier: this.visit(ctx.expression[0]),
                value: this.visit(ctx.expression[1]),
            }
        }
        this.paramCounter += 1
        return {
            ast: Ast.Param,
            identifier: {
                ast: Ast.Identifier,
                id: '__' + this.paramCounter.toString(),
            },
            value: this.visit(ctx.expression[0]),
        }
    }

    // Statements
    statement(ctx: any): AstStmt[] {
        if (ctx.attributeStatement) {
            return [this.visit(ctx.attributeStatement[0])]
        }

        if (ctx.declaration) {
            return this.visit(ctx.declaration[0])
        }

        if (ctx.withStatment) {
            return [this.visit(ctx.withStatement[0])]
        }

        if (ctx.expressions) {
            let exprs = this.visit(ctx.expressions[0])

            if (ctx.assignStatement) {
                const rhs = this.visit(ctx.assignStatement[0])

                if(exprs.length != rhs.length) {
                    this.errors.push({
                        message: 'Unbalanced assignment',
                        src: {
                            startLine: exprs[0].src.startLine,
                            startColumn: exprs[0].src.startColumn,
                            endLine: rhs[rhs.length - 1].src.endLine,
                            endColumn: rhs[rhs.length - 1].src.endColumn,
                        },
                        severity: DiagnosticSeverity.Error,
                    })
                }

                let assigns: IAstAssignStmt[] = []
                for (let i = 0; i < Math.min(exprs.length, rhs.length); i++) {
                    assigns.push({
                        ast: Ast.Assign,
                        lhs: exprs[i],
                        rhs: rhs[i],
                    })
                }
                return assigns
            }

            if (ctx.applyDictionaryStatement) {
                const dict = this.visit(ctx.applyDictionaryStatement[0])
                return exprs.map((expr: AstExpr) => {
                    return {ast: Ast.ApplyDict, expr, dict}
                })
            }
        }

        return []
    }

    statements(ctx: any): AstStmt[] {
        if (ctx.statement) {
            return [].concat.apply([], ctx.statement.map((ctx: any) => this.visit(ctx)))
        }
        return []
    }

    attributeStatement(ctx: any): IAstAttributeStmt {
        let statements: AstStmt[] = []
        let fqns: IAstFQN[] = []
        if (ctx.statements) {
            statements = this.visit(ctx.statements[0])
        } else if (ctx.declaration) {
            statements = this.visit(ctx.declaration[0])
        } else if (ctx.fullyQualifiedNames) {
            fqns = this.visit(ctx.fullyQualifiedNames[0])
        }
        return {
            ast: Ast.SetAttributes,
            attributes: ctx.attribute.map((ctx: any) => this.visit(ctx)),
            statements,
            fqns,
        }
    }

    withStatement(ctx: any): IAstWithStmt {
        return {
            ast: Ast.With,
            scope: this.visit(ctx.fullyQualifiedName[0]),
            statements: this.visit(ctx.statements[0]),
        }
    }

    assignStatement(ctx: any): AstExpr[] {
        return this.visit(ctx.expressions[0])
    }

    applyDictionaryStatement(ctx: any): IAstDict {
        return this.visit(ctx.dictionary[0])
    }

    declaration(ctx: any): AstStmt[] {
        let declType = AstDeclType.Net
        if (ctx.Net) {
            declType = AstDeclType.Net
        } else if (ctx.Input) {
            declType = AstDeclType.Input
        } else if (ctx.Output) {
            declType = AstDeclType.Output
        } else if (ctx.Inout) {
            declType = AstDeclType.Inout
        } else if (ctx.Analog) {
            declType = AstDeclType.Analog
        } else if (ctx.Cell) {
            declType = AstDeclType.Cell
        } else if (ctx.Const) {
            declType = AstDeclType.Const
        } else {
            /* istanbul ignore next */
            throwBug('declaration')
        }

        const width = this.visit(ctx.width)
        const ids = this.visit(ctx.identifiers[0])
        const decls = ids.map((id: IAstIdentifier) => {
            return {
                ast: Ast.Decl,
                attributes: [],
                declType,
                width,
                identifier: id,
            }
        })

        let assigns: IAstAssignStmt[] = []
        if (ctx.expressions) {
            const exprs = this.visit(ctx.expressions[0])
            if (ids.length != exprs.length) {
                this.errors.push({
                    message: 'Unbalanced assignment',
                    src: {
                        startLine: ids[0].src.startLine,
                        startColumn: ids[0].src.startColumn,
                        endLine: exprs[exprs.length - 1].src.endLine,
                        endColumn: exprs[exprs.length - 1].src.endColumn,
                    },
                    severity: DiagnosticSeverity.Error,
                })
            }

            for (let i = 0; i < Math.min(ids.length, exprs.length); i++) {
                assigns.push({
                    ast: Ast.Assign,
                    lhs: ids[i],
                    rhs: exprs[i],
                })
            }
        }

        return decls.concat(assigns)
    }

    width(ctx: any): AstExpr {
        if (ctx.expression) {
            return this.visit(ctx.expression[0])
        }
        return {
            ast: Ast.Literal,
            value: '1',
            litType: AstLiteralType.Integer,
        }
    }

    // Expressions
    expression(ctx: any): AstExpr {
        let expr = null

        if (ctx.literal) {
            expr = this.visit(ctx.literal[0])
        } else if (ctx.tupleExpression) {
            expr = this.visit(ctx.tupleExpression[0])
        } else if (ctx.anonymousModule) {
            expr = this.visit(ctx.anonymousModule[0])
        } else if (ctx.identifier) {
            const ident = this.visit(ctx.identifier[0])

            if (ctx.referenceExpression) {
                expr = this.visit(ctx.referenceExpression[0])
                expr.identifier = ident
                expr.src.startLine = ident.src.startLine
                expr.src.startColumn = ident.src.startColumn
            } else if (ctx.moduleInstantiation) {
                expr = this.visit(ctx.moduleInstantiation[0])
                expr.module = ident
                expr.src = {
                    startLine: ident.src.startLine,
                    startColumn: ident.src.startColumn,
                    endLine: (expr.dict.src || ident.src).endLine,
                    endColumn: (expr.dict.src || ident.src).endColumn,
                }
            } else {
                expr = ident
            }
        } else {
            /* istanbul ignore next */
            throwBug('expression')
        }

        if (ctx.binaryOp) {
            const binop = this.visit(ctx.binaryOp[0])
            binop.lhs = expr
            return binop
        } else {
            return expr
        }
    }

    literal(ctx: any): IAstLiteral {
        if (ctx.Integer) {
            return {
                ast: Ast.Literal,
                value: ctx.Integer[0].image,
                litType: AstLiteralType.Integer,
                src: tokenToSrcLoc(ctx.Integer[0]),
            }
        }

        if (ctx.Constant) {
            return {
                ast: Ast.Literal,
                value: ctx.Constant[0].image,
                litType: AstLiteralType.Constant,
                src: tokenToSrcLoc(ctx.Constant[0]),
            }
        }

        if (ctx.Unit) {
            return {
                ast: Ast.Literal,
                value: ctx.Unit[0].image,
                litType: AstLiteralType.Unit,
                src: tokenToSrcLoc(ctx.Unit[0]),
            }
        }

        if (ctx.String) {
            return {
                ast: Ast.Literal,
                value: ctx.String[0].image,
                litType: AstLiteralType.String,
                src: tokenToSrcLoc(ctx.String[0]),
            }
        }

        if (ctx.Real) {
            return {
                ast: Ast.Literal,
                value: ctx.Real[0].image,
                litType: AstLiteralType.Real,
                src: tokenToSrcLoc(ctx.Real[0]),
            }
        }

        if (ctx.True) {
            return {
                ast: Ast.Literal,
                value: ctx.True[0].image,
                litType: AstLiteralType.Boolean,
                src: tokenToSrcLoc(ctx.True[0]),
            }
        }

        if (ctx.False) {
            return {
                ast: Ast.Literal,
                value: ctx.False[0].image,
                litType: AstLiteralType.Boolean,
                src: tokenToSrcLoc(ctx.False[0]),
            }
        }

        /* istanbul ignore next */
        throwBug('literal')
        /* istanbul ignore next */
        return { ast: Ast.Literal, value: '', litType: AstLiteralType.Boolean }
    }

    expressions(ctx: any): AstExpr[] {
        return ctx.expression.map((ctx: any) => {
            return this.visit(ctx)
        })
    }

    binaryOp(ctx: any): AstExpr {
        let op = AstBinaryOp.Add
        if (ctx.Plus) {
            op = AstBinaryOp.Add
        } else if (ctx.Minus) {
            op = AstBinaryOp.Sub
        } else if (ctx.Star) {
            op = AstBinaryOp.Mul
        } else if (ctx.ShiftLeft) {
            op = AstBinaryOp.Shl
        } else if (ctx.ShiftRight) {
            op = AstBinaryOp.Shr
        } else {
            /* istanbul ignore next */
            throwBug('binaryOp')
        }

        return {
            ast: Ast.BinOp,
            op,
            lhs: { ast: Ast.Identifier, id: '' },
            rhs: this.visit(ctx.expression[0])
        }
    }

    tupleExpression(ctx: any): IAstTuple {
        return {
            ast: Ast.Tuple,
            expressions: this.visit(ctx.expressions[0]),
            src: {
                startLine: ctx.OpenRound[0].startLine,
                startColumn: ctx.OpenRound[0].startColumn,
                endLine: ctx.CloseRound[0].endLine,
                endColumn: ctx.CloseRound[0].endColumn,
            }
        }
    }

    dictionary(ctx: any): IAstDict {
        let entries: IAstDictEntry[] = []
        if (ctx.dictionaryEntry) {
            entries = ctx.dictionaryEntry.map((ctx: any) => this.visit(ctx))
        }

        return {
            ast: Ast.Dict,
            entries,
            star: !!ctx.Star,
            src: {
                startLine: ctx.OpenCurly[0].startLine,
                startColumn: ctx.OpenCurly[0].startColumn,
                endLine: ctx.CloseCurly[0].endLine,
                endColumn: ctx.CloseCurly[0].endColumn,
            }
        }
    }

    dictionaryEntry(ctx: any): IAstDictEntry {
        const identifier = this.visit(ctx.identifier[0])

        if (ctx.expression) {
            return {
                ast: Ast.DictEntry,
                identifier,
                expr: this.visit(ctx.expression[0])
            }
        } else {
            return {
                ast: Ast.DictEntry,
                identifier,
                expr: identifier
            }
        }
    }

    referenceExpression(ctx: any): IAstReference {
        const from_ = this.visit(ctx.expression[0])
        let to = from_
        if (ctx.expression[1]) {
            to = this.visit(ctx.expression[1])
        }

        return {
            ast: Ast.Ref,
            identifier: { ast: Ast.Identifier, id: '' },
            from: from_,
            to,
            src: {
                startLine: 0,
                startColumn: 0,
                endLine: ctx.CloseSquare[0].endLine,
                endColumn: ctx.CloseSquare[0].endColumn,
            }
        }
    }

    anonymousModule(ctx: any): IAstAnonymousModule {
        return {
            ast: Ast.AnonymousMod,
            statements: this.visit(ctx.statements[0])
        }
    }

    moduleInstantiation(ctx: any): IAstModInst {
        let inst: IAstModInst = {
            ast: Ast.ModInst,
            module: { ast: Ast.Identifier, id: '' },
            parameters: this.visit(ctx.parameterList[0]),
            width: this.visit(ctx.width),
            dict: { ast: Ast.Dict, entries: [], star: false }
        }

        if (ctx.dictionary) {
            inst.dict = this.visit(ctx.dictionary[0])
        }

        return inst
    }
}

export const elaboratorInstance = new ElectronElaborationVisitor()

export function elaborate(path: string, text: string): IAstResult {
    let errors: IDiagnostic[] = []

    // lex
    const lexingResult = lexerInstance.tokenize(text)
    for (let err of lexingResult.errors) {
        errors.push({
            message: err.message,
            src: {
                startLine: err.line,
                startColumn: err.column,
                endLine: err.line,
                endColumn: err.column + err.length,
            },
            severity: DiagnosticSeverity.Error,
        })
    }

    if (errors.length > 0) {
        return {errors}
    }

    // parse
    parserInstance.input = lexingResult.tokens
    const cst = parserInstance.design()
    for (let err of parserInstance.errors) {
        let lastToken = err.token
        if (err.resyncedTokens.length > 0) {
            lastToken = err.resyncedTokens[err.resyncedTokens.length - 1]
        }
        errors.push({
            message: err.message,
            src: {
                startLine: err.token.startLine || 0,
                startColumn: err.token.startColumn || 0,
                endLine: lastToken.endLine || 0,
                endColumn: lastToken.endColumn || 0,
            },
            severity: DiagnosticSeverity.Error,
        })
    }

    if (errors.length > 0) {
        return {errors}
    }

    // elaborate
    const ast = elaboratorInstance.visit(cst)
    errors = elaboratorInstance.errors

    return {ast, errors}
}
