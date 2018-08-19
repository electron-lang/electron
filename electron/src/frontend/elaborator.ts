import * as ast from './ast'
import { Crate } from '../crate'
import { FileInfo } from '../file'
import { Logger, SrcLoc, ISrcLoc } from '../diagnostic'
import { parserInstance } from './parser'
import { SymbolTable, Symbol, ISymbol } from './symbolTable'
import { allAttributes } from './attributes'
import { allTypeHandlers } from './parameters'
import { TypeChecker } from './typechecker'

const BaseElectronVisitor = parserInstance.getBaseCstVisitorConstructor()

type PortDecl = [ast.IRef<ast.IPort>, ast.Expr]
type DictEntry = [ISymbol, ast.Expr]

interface Dict {
    star: boolean,
    starSrc: ISrcLoc,
    conns: DictEntry[]
}

type Param = [string | number, ast.Expr, ISrcLoc]

interface PartialInst extends Dict {
    params: Param[]
    src: ISrcLoc
}

function elaboratePartialInst(logger: Logger,
                              st: SymbolTable<ast.Decl>,
                              tc: TypeChecker,
                              ref: ast.IRef<ast.IModule>,
                              pinst: PartialInst): ast.IInst {
    const inst = ast.Inst(ref, [], [], pinst.src)
    // For star elaboration
    let dict: {[port: string]: boolean} = {}

    // Lookup params
    st.enterScope()
    for (let param of ref.ref.params) {
        st.define(Symbol(param.name, param.src), param)
    }

    for (let [p, expr, src] of pinst.params) {
        let param: ast.Decl | null | undefined = null
        if (typeof p === 'number') {
            param = ref.ref.params[p]
            if (!param) {
                logger.error(`Module '${inst.mod.ref.name}' doesn't have ` +
                             `a parameter at position '${p}'.`, expr.src)
            }
        } else {
            param = st.lookup(Symbol(p, src))
        }
        if (param && param.tag === 'param') {
            tc.checkParam(param, expr)
            inst.params.push([ast.Ref(param, src), expr])
        }
    }
    st.exitScope()

    // Lookup ports
    st.enterScope()
    for (let port of ref.ref.ports) {
        st.define(Symbol(port.name, port.src), port)
    }


    for (let [symbol, expr] of pinst.conns) {
        const port = st.lookup(symbol)
        if (port && port.tag === 'port') {
            inst.conns.push([ast.Ref(port, symbol.src), expr])
            dict[port.name] = true
        }
        tc.checkIsSignal(expr)
    }
    st.exitScope()

    // Elaborate star
    if (pinst.star) {
        for (let port of inst.mod.ref.ports) {
            if (!dict[port.name]) {
                const decl = st.lookup(Symbol(port.name, pinst.starSrc))
                if (!decl) continue
                const expr = ast.Ref(decl, pinst.starSrc)
                tc.checkIsSignal(expr)
                inst.conns.push([
                    ast.Ref(port, pinst.starSrc),
                    expr
                ])
            }
        }
    }

    return inst
}

function doAssign(info: FileInfo, tc: TypeChecker,
                  lhs: ast.Expr[], rhs: ast.Expr[]): ast.IAssign[] {
    if(lhs.length != rhs.length) {
        const src = new SrcLoc(info.file, [
            lhs[0].src.startLine,
            lhs[0].src.startColumn,
            rhs[rhs.length - 1].src.endLine,
            rhs[rhs.length - 1].src.endColumn,
        ])
        info.logger.error('Unbalanced assignment', src)
    }

    let assigns: ast.IAssign[] = []
    for (let i = 0; i < Math.min(lhs.length, rhs.length); i++) {
        const assign = ast.Assign(lhs[i], rhs[i])
        assigns.push(assign)
        if (tc.checkAssign(assign)) {
            if (rhs[i].tag === 'inst' && lhs[i].tag === 'ref') {
                const l = lhs[i] as ast.IRef<ast.ICell>
                const r = rhs[i] as ast.IInst
                if (r.mod.ref.anonymous) {
                    r.mod.ref.name = l.ref.name
                }
            }
        }
    }
    return assigns
}

export class Elaborator extends BaseElectronVisitor {
    protected logger: Logger

    private paramCounter: number = 0
    private modst: SymbolTable<ast.IModule>;
    private st: SymbolTable<ast.Decl>;
    private tc: TypeChecker;

    constructor(readonly info: FileInfo, readonly crate?: Crate) {
        super()
        this.validateVisitor()
        this.logger = info.logger
        this.modst = new SymbolTable(info)
        this.st = new SymbolTable(info)
        this.tc = new TypeChecker(info)
    }

    design(ctx: any): ast.IModule[] {
        if (ctx.DesignComment) {
            // TODO
        }
        if (ctx.moduleImport) {
            ctx.moduleImport.forEach((ctx: any) => this.visit(ctx))
        }

        if (ctx.moduleDeclaration) {
            return ctx.moduleDeclaration.map((ctx: any) => this.visit(ctx))
        }

        return []
    }

    moduleImport(ctx: any) {
        const str = ctx.String[0].image
        const pkg = str.substring(1, str.length - 1)

        if (!this.crate) {
            this.logger.bug('Crate not passed to constructor')
            return
        }

        const file = this.crate.resolveImport(this.info.file, pkg)

        if (!file) {
            this.logger.error(`File '${pkg}' not found.`,
                              SrcLoc.fromToken(this.info.file, ctx.String[0]))
            return
        }

        const modules = file.declarations

        for (let ident of this.visit(ctx.identifiers[0])) {
            let found = false
            for (let mod of modules) {
                if (mod.name === ident.id) {
                    this.modst.define(ident, mod)
                    found = true
                }
            }
            if (!found) {
                this.logger.error(`No exported module '${ident.id}' ` +
                                  `in package '${pkg}'.`, ident.src)
            }
        }
    }

    moduleDeclaration(ctx: any): ast.IModule {
        const ident = this.visit(ctx.identifier[0])
        const mod = ast.Module(ident.id, [], ident.src)
        mod.manglingPrefix = this.info.manglingPrefix
        this.modst.define(ident, mod)
        this.st.enterScope(ident.id)

        /*if (mod.name[0].toUpperCase() !== mod.name[0]) {
            this.logger.warn(
                `Module '${mod.name}' starts with a lowercase letter.`,
                mod.src)
        }*/

        mod.doc = ctx.ModuleComment
            ? ctx.ModuleComment.map((doc: any) => {
                return doc.image.substring(4) + '\n'
            }).join('')
            : ''
        mod.exported = !!ctx.Export
        mod.declaration = !!ctx.Declare

        if (ctx.attribute) {
            mod.attrs = ctx.attribute.map((ctx: any) => this.visit(ctx))
        }

        if (ctx.parameterDeclarationList) {
            for (let param of this.visit(ctx.parameterDeclarationList[0])) {
                mod.params.push(param)
            }
        }

        if (ctx.statements) {
            for (let stmt of this.visit(ctx.statements[0])) {
                mod.stmts.push(stmt)
                if (stmt.tag === 'port') {
                    mod.ports.push(stmt)
                }
            }
        }

        if (mod.declaration) {
            if (mod.stmts.length - mod.ports.length > 0) {
                this.logger.error(`Declared module '${mod.name}' contains ` +
                                  `assignments.`, mod.src)
            }
        }

        this.st.exitScope()
        return mod
    }

    identifiers(ctx: any): ISymbol[] {
        return ctx.identifier.map((ctx: any) => this.visit(ctx))
    }

    identifier(ctx: any): ISymbol {
        const text = ctx.Identifier[0].image
        const src = SrcLoc.fromToken(this.info.file, ctx.Identifier[0])
        if (text.startsWith("'")) {
            return Symbol(text.substring(1), src)
        }
        return Symbol(text, src)
    }

    // Attributes
    attribute(ctx: any): ast.IAttr {
        const name = ctx.Attribute[0].image.substring(1)
        const src = SrcLoc.fromToken(this.info.file, ctx.Attribute[0])
        const params: ast.Expr[] = (() => {
            if (ctx.attributeParameter) {
                return ctx.attributeParameter.map((ctx: any) => this.visit(ctx))
            }
            return []
        })()
        const attr = ast.Attr(name, params, src)

        if (!(attr.name in allAttributes)) {
            this.logger.error(`Unknown attribute '${attr.name}'.`,
                              attr.src)
        } else {
            const attrHandler = allAttributes[attr.name]
            attrHandler.validate(this.logger, attr)
        }

        return attr
    }

    attributeParameter(ctx: any): ast.Literal | ast.IRef<ast.IModule> {
        if (ctx.identifier) {
            const sym = this.visit(ctx.identifier[0])
            const mod = this.modst.lookup(sym)
            if (mod) {
                return ast.Ref(mod, sym.src)
            }
            return ast.Integer(1)
        } else {
            return this.visit(ctx.literal[0])
        }
    }

    parameterDeclarationList(ctx: any): ast.IParam[] {
        this.paramCounter = 0
        if (ctx.parameterDeclaration) {
            return ctx.parameterDeclaration.map((ctx: any) => this.visit(ctx))
        }
        return []
    }

    parameterDeclaration(ctx: any): ast.IParam {
        const name = this.visit(ctx.identifier[0])
        const ty = this.visit(ctx.identifier[1])
        const param = ast.Param(name.id, ty.id, name.src, ty.src)
        this.st.define(name, param)

        if (name.id.toUpperCase() !== name.id) {
            this.logger.warn(`Parameter '${name.id}' contains ` +
                             `lowercase letters.`,
                             name.src)
        }

        if (!(ty.id in allTypeHandlers)) {
            this.logger.error(`Unknown parameter type '${ty.id}'`,
                              ty.src)
        }

        return param
    }

    // Statements
    statements(ctx: any): ast.Stmt[] {
        if (ctx.statement) {
            return [].concat.apply([], ctx.statement.map((ctx: any) => this.visit(ctx)))
        }
        return []
    }

    statement(ctx: any): ast.Stmt[] {
        if (ctx.attributeStatement) {
            return this.visit(ctx.attributeStatement[0])
        }

        if (ctx.declaration) {
            return this.visit(ctx.declaration[0])
        }

        if (ctx.assignStatement) {
            return this.visit(ctx.assignStatement[0])
        }

        return []
    }

    attributeStatement(ctx: any): ast.Stmt[] {
        const attrs = ctx.attribute.map((ctx: any) => this.visit(ctx))
        const addAttrs = (stmt: ast.Stmt) => {
            switch(stmt.tag) {
                case 'port':
                case 'net':
                case 'cell':
                    stmt.attrs = stmt.attrs.concat(attrs)
                    break
                case 'const':
                case 'assign':
                    break
            }
            return stmt
        }
        if (ctx.statements) {
            return this.visit(ctx.statements[0]).map(addAttrs)
        } else if (ctx.declaration) {
            return this.visit(ctx.declaration[0]).map(addAttrs)
        }

        /* istanbul ignore next */
        this.logger.bug('attributeStatement')
        /* istanbul ignore next */
        return []
    }

    assignStatement(ctx: any): ast.IAssign[] {
        const lhs = this.visit(ctx.expressions[0]) as ast.Expr[]
        const rhs = this.visit(ctx.expressions[1]) as ast.Expr[]

        return doAssign(this.info, this.tc, lhs, rhs)
    }

    declaration(ctx: any): ast.Stmt[] {
        const width = this.visit(ctx.width)
        const ids: ISymbol[] = this.visit(ctx.identifiers[0])

        let decls = (() => {
            if (ctx.Net) {
                return ids.map((ident) => ast.Net(ident.id, width, ident.src))
            } else if (ctx.Cell) {
                return ids.map((ident) => ast.Cell(ident.id, width, ident.src))
            } else if (ctx.Const) {
                return ids.map((ident) => ast.Const(ident.id, ident.src))
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
                return ids.map((ident) => ast.Port(ident.id, ty, width, ident.src))
            }
        })()

        let refs = []
        for (let decl of decls) {
            this.st.define(Symbol(decl.name, decl.src), decl)
            refs.push(ast.Ref(decl, decl.src))
        }

        let assigns: ast.IAssign[] = []
        if (ctx.expressions) {
            const exprs = this.visit(ctx.expressions[0])
            assigns = doAssign(this.info, this.tc, refs, exprs)
        }

        return (decls as ast.Stmt[]).concat(assigns)
    }

    width(ctx: any): ast.Expr {
        if (ctx.expression) {
            const expr = this.visit(ctx.expression[0])
            this.tc.checkIsInteger(expr)
            return expr
        }
        return ast.Integer(1)
    }

    // Expressions
    expressions(ctx: any): ast.Expr[] {
        return ctx.expression.map((ctx: any) => {
            return this.visit(ctx)
        })
    }

    expression(ctx: any): ast.Expr {
        let expr = null

        if (ctx.literal) {
            expr = this.visit(ctx.literal[0])
        } else if (ctx.tupleExpression) {
            expr = this.visit(ctx.tupleExpression[0])
        } else if (ctx.anonymousCell) {
            expr = this.visit(ctx.anonymousCell[0])
        } else if (ctx.identifier) {
            const sym = this.visit(ctx.identifier[0])
            let lookupSym = () => {
                // When symbol lookup fails return anything
                // compilation will be aborted if there are errors
                // after elaboration
                return this.st.lookup(sym) || ast.Net('not-found')
            }

            if (ctx.referenceExpression) {
                const range: [ast.Expr, ast.Expr, ISrcLoc] =
                    this.visit(ctx.referenceExpression[0])
                expr = ast.Range(ast.Ref(lookupSym(), sym.src), range[0], range[1], range[2])
            } else if (ctx.moduleInstantiation) {
                const pinst: PartialInst = this.visit(ctx.moduleInstantiation[0])
                const mod = this.modst.lookup(sym)
                if (mod) {
                    pinst.src = sym.src
                    expr = elaboratePartialInst(this.logger, this.st, this.tc,
                                                ast.Ref(mod, sym.src), pinst)
                } else {
                    expr = ast.Inst(ast.Ref(ast.Module('not-found', [], sym.src)),
                                    [], [], pinst.src)
                }
            } else {
                expr = ast.Ref(lookupSym(), sym.src)
            }
        } else {
            /* istanbul ignore next */
            this.logger.bug('expression')
        }

        if (ctx.binaryOp) {
            const [op, rhs] = this.visit(ctx.binaryOp[0])
            return ast.BinOp(op, expr, rhs)
        } else {
            return expr
        }
    }

    literal(ctx: any): ast.Literal {
        if (ctx.Integer) {
            return ast.Integer(parseInt(ctx.Integer[0].image),
                               SrcLoc.fromToken(this.info.file, ctx.Integer[0]))
        }

        if (ctx.BitVector) {
            const bv = ctx.BitVector[0].image.split("'")
            const src = SrcLoc.fromToken(this.info.file, ctx.BitVector[0])
            const size = parseInt(bv[0])
            let bits: ast.Bit[] = []
            if (bits.length > size) {
                this.logger.error(`Bitvector value ${bv[1]} is larger than ` +
                                  `size ${size}.`, src)
            } else {
                for (let i = 0; i < size; i++) {
                    if (bv[1][i]) {
                        bits.push(bv[1][i])
                    } else {
                        bits.push('0')
                    }
                }
            }
            return ast.BitVector(bits, src)
        }

        if (ctx.Unit) {
            return ast.Unit(ctx.Unit[0].image,
                            SrcLoc.fromToken(this.info.file, ctx.Unit[0]))
        }

        if (ctx.String) {
            const val = ctx.String[0].image
            const src = SrcLoc.fromToken(this.info.file, ctx.String[0])
            return ast.String(val.substring(1, val.length - 1), src)
        }

        if (ctx.Real) {
            return ast.Real(parseFloat(ctx.Real[0].image),
                            SrcLoc.fromToken(this.info.file, ctx.Real[0]))
        }

        if (ctx.True) {
            return ast.Bool(true, SrcLoc.fromToken(this.info.file, ctx.True[0]))
        }

        if (ctx.False) {
            return ast.Bool(false, SrcLoc.fromToken(this.info.file, ctx.False[0]))
        }

        if (ctx.xml) {
            return this.visit(ctx.xml[0])
        }

        /* istanbul ignore next */
        this.logger.bug('literal')
        /* istanbul ignore next */
        return ast.Bool(true)
    }

    binaryOp(ctx: any): [ast.BinOp, ast.Expr] {
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
              /* istanbul ignore next */
              this.logger.bug('binaryOp')
              /* istanbul ignore next */
              return '+'
          }
        })()
        return [ op, this.visit(ctx.expression[0]) ]
    }

    tupleExpression(ctx: any): ast.ITuple {
        const src = new SrcLoc(this.info.file, [
            ctx.OpenRound[0].startLine,
            ctx.OpenRound[0].startColumn,
            ctx.CloseRound[0].endLine,
            ctx.CloseRound[0].endColumn,
        ])
        return ast.Tuple(this.visit(ctx.expressions[0]), src)
    }

    referenceExpression(ctx: any): [ast.Expr, ast.Expr, ISrcLoc] {
        const start = this.visit(ctx.expression[0])
        this.tc.checkIsInteger(start)
        let end = start
        if (ctx.expression[1]) {
            end = this.visit(ctx.expression[1])
            this.tc.checkIsInteger(end)
        }

        const src = new SrcLoc(this.info.file, [
            ctx.OpenSquare[0].startLine,
            ctx.OpenSquare[0].endColumn,
            ctx.CloseSquare[0].endLine,
            ctx.CloseSquare[0].endColumn,
        ])
        return [ start, end, src ]
    }

    anonymousCell(ctx: any): ast.IInst {
        let mod = ast.Module('', [])
        mod.manglingPrefix = this.info.manglingPrefix
        mod.anonymous = true
        mod.src = SrcLoc.fromToken(this.info.file, ctx.Cell[0])

        const conns = [].concat.apply([], (() => {
            if (ctx.cellStatement) {
                return ctx.cellStatement.map((ctx: any) => this.visit(ctx))
            }
            return []
        })())

        for (let [ref,] of conns) {
            mod.ports.push(ref.ref)
        }

        return ast.Inst(ast.Ref(mod), [], conns, mod.src)
    }

    cellStatement(ctx: any): PortDecl[] {
        if (ctx.cellPortDeclaration) {
            return this.visit(ctx.cellPortDeclaration[0])
        } else {
            return this.visit(ctx.cellAttributeStatement[0])
        }
    }

    cellAttributeStatement(ctx: any): PortDecl[] {
        const attrs: ast.IAttr[] =
            ctx.attribute.map((ctx: any) => this.visit(ctx))

        if (ctx.cellPortDeclaration) {
            return this.visit(ctx.cellPortDeclaration[0])
                .map((p: PortDecl) => {
                    p[0].ref.attrs = attrs.concat(p[0].ref.attrs)
                    return p
                })
        }
        return [].concat.apply([], ctx.cellStatement.map((ctx: any) => this.visit(ctx)))
            .map((p: PortDecl) => {
                p[0].ref.attrs = attrs.concat(p[0].ref.attrs)
                return p
            })
    }

    cellPortDeclaration(ctx: any): PortDecl[] {
        const ty: ast.PortType = (() => {
            if (ctx.Analog) {
                return 'analog'
            }
            if (ctx.Input) {
                return 'input'
            }
            if (ctx.Output) {
                return 'output'
            }
            if (ctx.Inout) {
                return 'inout'
            }
            /* istanbul ignore next */
            this.logger.bug('anonymousCellDeclaration')
            /* istanbul ignore next */
            return 'analog'
        })()

        const width = this.visit(ctx.width[0])
        const syms = this.visit(ctx.identifiers[0])
        const ports = syms.map((sym: ISymbol) => {
            return ast.Ref(ast.Port(sym.id, ty, width, sym.src), sym.src)
        })

        if (ctx.expressions) {
            const exprs = this.visit(ctx.expressions[0])

            if (ports.length != exprs.length) {
                const src = new SrcLoc(this.info.file, [
                    ports[0].src.startLine,
                    ports[0].src.startColumn,
                    exprs[exprs.length - 1].src.endLine,
                    exprs[exprs.length - 1].src.endColumn,
                ])
                this.logger.error('Unbalanced assignment', src)
            }

            const pdecls: PortDecl[] = []

            for (let i = 0; i < Math.min(ports.length, exprs.length); i++) {
                pdecls.push([ports[i], exprs[i]])
            }

            return pdecls
        } else {
            const pdecls: PortDecl[] = []

            for (let i = 0; i < syms.length; i++) {
                const expr = this.st.lookup(syms[i])
                if (expr) {
                    pdecls.push([ ports[i], ast.Ref(expr, ports[i].src) ])
                }
            }

            return pdecls
        }
    }

    moduleInstantiation(ctx: any): PartialInst {
        const params: Param[] = this.visit(ctx.parameterList[0])
        const dict: Dict = this.visit(ctx.dictionary[0])
        return {
            params,
            star: dict.star, starSrc: dict.starSrc,
            conns: dict.conns,
            src: SrcLoc.empty(this.info.file),
        }
    }

    parameterList(ctx: any): Param[] {
        this.paramCounter = 0
        if (ctx.parameter) {
            return ctx.parameter.map((ctx: any) => this.visit(ctx))
        }
        return []
    }

    parameter(ctx: any): Param {
        if (ctx.expression.length > 1) {
            if (ctx.expression[0].children.identifier) {
                const ident = ctx.expression[0].children.identifier[0].children
                let sym = this.identifier(ident)
                const expr = this.visit(ctx.expression[1])
                return [ sym.id, expr, expr.src ]
            } else {
                /* istanbul ignore next */
                const expr = this.visit(ctx.expression[0])
                /* istanbul ignore next */
                this.logger.error(`Expecting identifier but found '${expr.tag}'`,
                                  expr.src)
            }
        }
        const expr = this.visit(ctx.expression[0])
        return [ this.paramCounter++, expr, expr.src ]
    }

    dictionary(ctx: any): Dict {
        let star = false
        let starSrc = SrcLoc.empty(this.info.file)
        let conns: [ISymbol, ast.Expr][] = []

        if (ctx.Star) {
            star = true
            starSrc = SrcLoc.fromToken(this.info.file, ctx.Star[0])
        }

        if (ctx.dictionaryEntry) {
            conns = ctx.dictionaryEntry.map((ctx: any) => this.visit(ctx))
        }

        return {star, starSrc, conns}
    }

    dictionaryEntry(ctx: any): DictEntry {
        const sym: ISymbol = this.visit(ctx.identifier[0])
        if (ctx.expression) {
            const expr: ast.Expr = this.visit(ctx.expression[0])
            this.tc.checkIsSignal(expr)
            return [sym, expr]
        } else {
            return [
                sym,
                ast.Ref(this.st.lookup(sym) || ast.Net('not-found'),
                        sym.src)
            ]
        }
    }

    xml(ctx: any): ast.IXml {
        if (ctx.Tag) {
            return ast.Xml(ctx.Tag[0].image, SrcLoc.fromToken(this.info.file, ctx.Tag[0]))
        }
        const bodyStr = ctx.xml ? ctx.xml.map((ctx: any) => {
            return this.visit(ctx).value
        }).join('') : ''
        const str = ctx.OpenTag[0].image + bodyStr + ctx.CloseTag[0].image
        const openSrc = SrcLoc.fromToken(this.info.file, ctx.OpenTag[0])
        const closeSrc = SrcLoc.fromToken(this.info.file, ctx.CloseTag[0])
        const src = new SrcLoc(this.info.file, [
            openSrc.startLine,
            openSrc.startColumn,
            closeSrc.endLine,
            closeSrc.endColumn,
        ])
        return ast.Xml(str, src)
    }
}
