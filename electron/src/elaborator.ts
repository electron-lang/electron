import { lexerInstance, parserInstance } from './parser'
import * as ast from './ast'
import { IDiagnostic, DiagnosticPublisher,
         SrcLoc, Pos, ISrcLoc, tokenToSrcLoc } from './diagnostic'

const BaseElectronVisitor = parserInstance.getBaseCstVisitorConstructor()

function throwBug(rule: string): void {
    throw new Error('Programming Error: Parser/Elaborator missmatch ' +
                    `at rule '${rule}'.\n` +
                    'Please report the bug at https://github.com/electron-lang/electron')
}

export class Elaborator extends BaseElectronVisitor {
    private paramCounter: number = 0

    constructor(private logger: DiagnosticPublisher) {
        super()
        this.validateVisitor()
    }

    design(ctx: any): ast.IDesign {
        let design = ast.Design()

        if (ctx.moduleImport) {
            design.imports = ctx.moduleImport.map((ctx: any) => this.visit(ctx))
        }

        if (ctx.moduleDeclaration) {
            design.modules = ctx.moduleDeclaration.map((ctx: any) => this.visit(ctx))
        }

        return design
    }

    moduleImport(ctx: any): ast.IImport {
        const pkg = ctx.String[0].image
        return ast.Import(this.visit(ctx.identifiers),
                          pkg.substring(1, pkg.length - 1),
                          tokenToSrcLoc(ctx.String[0]))
    }

    moduleDeclaration(ctx: any): ast.IModule {
        let ident = this.visit(ctx.identifier[0])
        let mod = ast.Module(ident.id, [], ident.src)

        mod.exported = !!ctx.Export
        mod.declaration = !!ctx.Declare

        if (ctx.attribute) {
            mod.attrs = ctx.attribute.map((ctx: any) => this.visit(ctx))
        }

        if (ctx.parameterDeclarationList) {
            mod.params = this.visit(ctx.parameterDeclarationList[0])
        }

        if (ctx.statements) {
            ast.AddStmts(mod, this.visit(ctx.statements[0]))
        }

        return mod
    }

    identifier(ctx: any): ast.IIdent {
        return ast.Ident(ctx.Identifier[0].image, tokenToSrcLoc(ctx.Identifier[0]))
    }

    identifiers(ctx: any): ast.IIdent[] {
        return ctx.identifier.map((ctx: any) => this.visit(ctx))
    }

    fullyQualifiedName(ctx: any): ast.IFQN {
        return ast.FQN(ctx.identifier.map((ctx: any) => this.visit(ctx)))
    }

    fullyQualifiedNames(ctx: any): ast.IFQN[] {
        return ctx.fullyQualifiedName.map((ctx: any) => this.visit(ctx))
    }

    // Attributes
    attribute(ctx: any): ast.IAttr {
        const name = ast.Ident(ctx.Attribute[0].image.substring(1),
                               tokenToSrcLoc(ctx.Attribute[0]))
        return ast.Attr(name, this.visit(ctx.parameterList) || [])
    }

    parameterDeclarationList(ctx: any): ast.IParamDecl[] {
        this.paramCounter = 0
        if (ctx.parameterDeclaration) {
            return ctx.parameterDeclaration.map((ctx: any) => this.visit(ctx))
        }
        return []
    }

    parameterDeclaration(ctx: any): ast.IParamDecl {
        if (ctx.identifier.length > 1) {
            return ast.ParamDecl(this.visit(ctx.identifier[0]),
                                 this.visit(ctx.identifier[1]))
        }
        return ast.ParamDecl(this.paramCounter++, this.visit(ctx.identifier[0]))
    }

    parameterList(ctx: any): ast.IParam[] {
        this.paramCounter = 0
        if (ctx.parameter) {
            return ctx.parameter.map((ctx: any) => this.visit(ctx))
        }
        return []
    }

    parameter(ctx: any): ast.IParam {
        if (ctx.expression.length > 1) {
            return ast.Param(this.visit(ctx.expression[0]),
                             this.visit(ctx.expression[1]))
        }
        return ast.Param(this.paramCounter++,
                         this.visit(ctx.expression[0]))
    }

    // Statements
    statement(ctx: any): ast.Stmt[] {
        if (ctx.attributeStatement) {
            return [this.visit(ctx.attributeStatement[0])]
        }

        if (ctx.declaration) {
            return this.visit(ctx.declaration[0])
        }

        if (ctx.withStatment) {
            return [this.visit(ctx.withStatement[0])]
        }

        if (ctx.assignStatement) {
            return this.visit(ctx.assignStatement[0])
        }

        return []
    }

    statements(ctx: any): ast.Stmt[] {
        if (ctx.statement) {
            return [].concat.apply([], ctx.statement.map((ctx: any) => this.visit(ctx)))
        }
        return []
    }

    attributeStatement(ctx: any): ast.ISetAttr {
        const attrs = ctx.attribute.map((ctx: any) => this.visit(ctx))
        let setattr = ast.SetAttr(attrs)
        if (ctx.statements) {
            setattr.stmts = this.visit(ctx.statements[0])
        } else if (ctx.declaration) {
            setattr.stmts = this.visit(ctx.declaration[0])
        } else if (ctx.fullyQualifiedNames) {
            setattr.fqns = this.visit(ctx.fullyQualifiedNames[0])
        }
        return setattr
    }

    withStatement(ctx: any): ast.IWith {
        return ast.With(this.visit(ctx.fullyQualifiedName[0]),
                        this.visit(ctx.statements[0]))
    }

    assignStatement(ctx: any): ast.IAssign[] {
        const lhs = this.visit(ctx.expressions[0])
        const rhs = this.visit(ctx.expressions[1])
        if(lhs.length != rhs.length) {
            this.logger.error('Unbalanced assignment', {
                startLine: lhs[0].src.startLine,
                startColumn: lhs[0].src.startColumn,
                endLine: rhs[rhs.length - 1].src.endLine,
                endColumn: rhs[rhs.length - 1].src.endColumn,
            })
        }

        let assigns: ast.IAssign[] = []
        for (let i = 0; i < Math.min(lhs.length, rhs.length); i++) {
            assigns.push(ast.Assign(lhs[i], rhs[i]))
        }
        return assigns
    }

    declaration(ctx: any): ast.Stmt[] {
        const width = this.visit(ctx.width)
        const ids = this.visit(ctx.identifiers[0])

        let decls = (() => {
            if (ctx.Net) {
                return ids.map((ident: ast.IIdent) => ast.Net(ident, width))
            } else if (ctx.Cell) {
                return ids.map((ident: ast.IIdent) => ast.Cell(ident, width))
            } else if (ctx.Const) {
                return ids.map((ident: ast.IIdent) => ast.Const(ident))
            } else {
                const ty = (() => {
                    if (ctx.Input) {
                        return 'input'
                    } else if (ctx.Output) {
                        return 'output'
                    } else if (ctx.Inout) {
                        return 'inout'
                    } else {
                        return 'analog'
                    }
                })()
                return ids.map((ident: ast.IIdent) => ast.Port(ident, ty, width))
            }
        })()


        let assigns: ast.IAssign[] = []
        if (ctx.expressions) {
            const exprs = this.visit(ctx.expressions[0])
            if (ids.length != exprs.length) {
                this.logger.error('Unbalanced assignment', {
                        startLine: ids[0].src.startLine,
                        startColumn: ids[0].src.startColumn,
                        endLine: exprs[exprs.length - 1].src.endLine,
                        endColumn: exprs[exprs.length - 1].src.endColumn,
                })
            }

            for (let i = 0; i < Math.min(ids.length, exprs.length); i++) {
                assigns.push(ast.Assign(ids[i], exprs[i]))
            }
        }

        return decls.concat(assigns)
    }

    width(ctx: any): ast.Expr {
        if (ctx.expression) {
            return this.visit(ctx.expression[0])
        }
        return ast.Integer(1)
    }

    // Expressions
    expression(ctx: any): ast.Expr {
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
                expr.ident = ident
                expr.src.startLine = ident.src.startLine
                expr.src.startColumn = ident.src.startColumn
            } else if (ctx.moduleInstantiation) {
                expr = this.visit(ctx.moduleInstantiation[0])
                expr.module = ident.id
                expr.src = ident.src
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

    literal(ctx: any): ast.Literal {
        if (ctx.Integer) {
            return ast.Integer(parseInt(ctx.Integer[0].image),
                               tokenToSrcLoc(ctx.Integer[0]))
        }

        if (ctx.BitVector) {
            const bv = ctx.BitVector[0].image.split("'")
            const size = parseInt(bv[0])
            let bits: ast.Bit[] = []
            for (let i = 0; i < bv[1].length; i++) {
                bits.push(bv[1][i])
            }
            const src = tokenToSrcLoc(ctx.BitVector[0])
            return ast.BitVector(bits, src)
        }

        if (ctx.Unit) {
            const regex = /([0-9\.]*)([GMKkmunpf]?)([a-zA-Z]*)/
            const unit = ctx.Unit[0].image.match(regex)
            const src = tokenToSrcLoc(ctx.Unit[0])
            const exp = ((prefix) => {
                switch (prefix) {
                    case 'G': return 9
                    case 'M': return 6
                    case 'k':
                    case 'K': return 3
                    case 'm': return -3
                    case 'u': return -6
                    case 'n': return -9
                    case 'p': return -12
                    case 'f': return -15
                    default: return 0
                }
            })(unit[2])
            return ast.Unit(parseFloat(unit[1]), exp, unit[3], src)
        }

        if (ctx.String) {
            const val = ctx.String[0].image
            const src = tokenToSrcLoc(ctx.String[0])
            return ast.String(val.substring(1, val.length - 1), src)
        }

        if (ctx.Real) {
            return ast.Real(parseFloat(ctx.Real[0].image),
                            tokenToSrcLoc(ctx.Real[0]))
        }

        if (ctx.True) {
            return ast.Bool(true, tokenToSrcLoc(ctx.True[0]))
        }

        if (ctx.False) {
            return ast.Bool(false, tokenToSrcLoc(ctx.False[0]))
        }

        throwBug('literal')
        return ast.Bool(true)
    }

    expressions(ctx: any): ast.Expr[] {
        return ctx.expression.map((ctx: any) => {
            return this.visit(ctx)
        })
    }

    binaryOp(ctx: any): ast.IBinOp {
        const op = (() => {
          if (ctx.Plus) {
              return '+'
          } else if (ctx.Minus) {
              return '-'
          } else if (ctx.Star) {
              return '*'
          } else if (ctx.ShiftLeft) {
              return '<<'
          } else if (ctx.ShiftRight) {
              return '>>'
          } else {
              throwBug('binaryOp')
              return '+'
          }
        })()
        return ast.BinOp(op, ast.Ident(''), this.visit(ctx.expression[0]))
    }

    tupleExpression(ctx: any): ast.ITuple {
        return ast.Tuple(this.visit(ctx.expressions[0]),
                         SrcLoc(Pos(ctx.OpenRound[0].startLine,
                                    ctx.OpenRound[0].startColumn),
                                Pos(ctx.CloseRound[0].endLine,
                                    ctx.CloseRound[0].endColumn)))
    }

    dictionary(ctx: any): ast.IDict {
        let dict = ast.Dict(!!ctx.Star,
                            SrcLoc(Pos(ctx.OpenCurly[0].startLine,
                                       ctx.OpenCurly[0].startColumn),
                                   Pos(ctx.CloseCurly[0].endLine,
                                       ctx.CloseCurly[0].endColumn)))
        if (ctx.dictionaryEntry) {
            dict.entries = ctx.dictionaryEntry.map((ctx: any) => this.visit(ctx))
        }

        return dict
    }

    dictionaryEntry(ctx: any): ast.IDictEntry {
        const ident = this.visit(ctx.identifier[0])

        if (ctx.expression) {
            return ast.DictEntry(ident, this.visit(ctx.expression[0]))
        } else {
            return ast.DictEntry(ident, ident)
        }
    }

    referenceExpression(ctx: any): ast.IRef {
        const from_ = this.visit(ctx.expression[0])
        let to = from_
        if (ctx.expression[1]) {
            to = this.visit(ctx.expression[1])
        }

        return ast.Ref(ast.Ident(''), from_, to,
                       SrcLoc(Pos(ctx.OpenSquare[0].startLine,
                                  ctx.OpenSquare[0].endColumn),
                              Pos(ctx.CloseSquare[0].endLine,
                                  ctx.CloseSquare[0].endColumn)))
    }

    anonymousModule(ctx: any): ast.IAnonMod {
        return ast.AnonMod(this.visit(ctx.statements[0]))
    }

    moduleInstantiation(ctx: any): ast.IModInst {
        let inst = ast.ModInst('', this.visit(ctx.parameterList[0]),
                               ast.Dict())

        if (ctx.dictionary) {
            inst.dict = this.visit(ctx.dictionary[0])
        }

        return inst
    }
}
