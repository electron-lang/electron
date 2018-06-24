import { resolve, dirname } from 'path'
import { existsSync } from 'fs'
import { DiagnosticPublisher, DiagnosticLogger,
         emptySrcLoc, ISrcLoc } from './diagnostic'
import { SymbolTable } from './symbolTable'
import { Ast } from './ast'
import * as ast from './ast'
import * as ir from './backend/ir'
import { allAttributes } from './attributes'
import { allTypeHandlers } from './parameters'
import { File } from './file'

type Declarable = ir.IModule | ir.ICell | ir.IPort | ir.INet | ir.IParam

export class Validator {
    private ir: ir.IModule[] = []
    private symbolTable: SymbolTable<Declarable> = new SymbolTable(this.logger)

    constructor(private logger: DiagnosticPublisher) {

    }

    validate(path: string, design: ast.IAstDesign) {
        const dir = dirname(path)

        this.resolveImports(dir, design.imports)

        for (let mod of design.modules) {
            this.validateModule(mod)
        }

        return this.ir
    }

    resolveImports(dir: string, imports: ast.IAstImport[]) {
        for (let imp of imports) {
            if (imp.package.startsWith('.')) {
                const absPath = resolve(dir + '/' + imp.package + '.lec')
                if (!existsSync(absPath)) {
                    this.logger.error(`File ${absPath} doesn't exist.`, imp.src)
                } else {
                    let f = new File(new DiagnosticLogger(), absPath, null)
                    const modules = f.extractDeclarations()
                    for (let ident of imp.identifiers) {
                        let foundMod = false
                        for (let dmod of modules) {
                            if (dmod.identifier.id === ident.id) {
                                foundMod = true
                                this.validateModule(dmod)
                            }
                        }
                        if (!foundMod) {
                            this.logger.error(
                                `No exported module '${ident.id}' ` +
                                    `in package '${imp.package}'.`,
                                ident.src)
                        }
                    }
                }
            } else {
                // TODO resolve external modules from packages
                this.logger.warn('Package resolution unsupported', imp.src)
            }
        }
    }

    validateModule(mod: ast.IAstModule) {
        let irmod = ir.Module(mod.identifier.id)
        irmod.src = mod.identifier.src || emptySrcLoc
        this.ir.push(irmod)

        this.symbolTable.declareSymbol(mod.identifier.id, irmod)
        this.symbolTable.enterScope(mod.identifier.id)

        irmod.attrs = this.validateAttributes(mod.attributes)

        if (mod.identifier.id[0].toUpperCase() !== mod.identifier.id[0]) {
            this.logger.warn(
                `Module '${mod.identifier.id}' starts with a lowercase letter.`,
                mod.identifier.src)
        }

        this.validateParamDecls(mod.parameters)

        for (let stmt of mod.statements) {
            this.validateStmt(stmt)

            if (mod.declaration) {
                if (stmt.ast !== ast.Ast.Decl && stmt.ast !== ast.Ast.SetAttributes) {
                    this.logger.error(
                        `Declared module '${mod.identifier.id}' contains assignments.`,
                        mod.identifier.src)
                }
            }
        }

        this.symbolTable.exitScope()
    }

    validateAttributes(attrs: ast.IAstAttribute[]): ir.IAttr[] {
        let irattrs = []
        for (let attr of attrs) {
            if (!(attr.name.id in allAttributes)) {
                this.logger.error(`Unknown attribute '${attr.name.id}'.`,
                                  attr.name.src)
                continue
            }

            const attrHandler = allAttributes[attr.name.id]
            if (attrHandler.validate(this.logger, attr)) {
                for (let irattr of attrHandler.compile(attr)) {
                    irattrs.push(irattr)
                }
            }
        }
        return irattrs
    }

    validateParamDecls(params: ast.IAstParamDecl[]) {
        for (let param of params) {
            let irparam = ir.Param(param.identifier.id, null,
                                   param.identifier.src)
            this.symbolTable.declareSymbol(param.identifier.id, irparam)

            if (param.identifier.id.toUpperCase() !== param.identifier.id) {
                this.logger.warn(`Parameter '${param.identifier.id}' contains ` +
                                 `lowercase letters.`,
                                 param.identifier.src)
            }

            if (!(param.ty.id in allTypeHandlers)) {
                this.logger.error(`Unknown parameter type '${param.ty.id}'`,
                                  param.ty.src)
            }
        }
    }

    validateStmt(stmt: ast.AstStmt) {
        switch(stmt.ast) {
            case Ast.SetAttributes:
                this.validateSetAttributes(stmt as ast.IAstAttributeStmt)
                break
            case Ast.Decl:
                this.validateDeclStmt(stmt as ast.IAstDeclStmt)
                break
            case Ast.With:
                this.validateWith(stmt as ast.IAstWithStmt)
                break
            case Ast.Assign:
                this.validateAssign(stmt as ast.IAstAssignStmt)
                break
            case Ast.ApplyDict:
                this.validateApplyDict(stmt as ast.IAstApplyDictStmt)
                break
            default:
                throw new Error('never')
        }
    }

    validateIdentifier(ident: ast.IAstIdentifier): Declarable | null {
        let irdecl = this.symbolTable.resolveSymbol(ident.id)
        if (!irdecl) {
            this.logger.error(`Unknown symbol '${ident.id}'`, ident.src)
        }
        return irdecl
    }

    validateFQN(fqn: ast.IAstFQN): Declarable | null {
        let irdecl = null

        for (let i = 0; i < fqn.fqn.length - 2; i++) {
            this.symbolTable.enterScope(fqn.fqn[i].id)
        }

        irdecl = this.validateIdentifier(fqn.fqn[fqn.fqn.length - 1])

        for (let i = 0; i < fqn.fqn.length - 2; i++) {
            this.symbolTable.exitScope()
        }

        return irdecl
    }

    validateSetAttributes(setAttrs: ast.IAstAttributeStmt) {
        let irattrs = this.validateAttributes(setAttrs.attributes)
        for (let stmt of setAttrs.statements) {
            this.validateStmt(stmt)
            if (stmt.ast === Ast.Decl) {
                let irdecl = this.symbolTable.resolveSymbol(stmt.identifier.id)
                if (irdecl && irdecl.tag !== 'param') {
                    for (let irattr of irattrs) {
                        irdecl.attrs.push(irattr)
                    }
                }
            }
        }
        for (let fqn of setAttrs.fqns) {
            let irdecl = this.validateFQN(fqn)

            if (irdecl && irdecl.tag !== 'param') {
                for (let irattr of irattrs) {
                    irdecl.attrs.push(irattr)
                }
            }
        }
    }

    evalExpr(expr: ast.AstExpr): ast.AstExpr {
        // TODO
        return {
            ast: Ast.Literal,
            value: '1',
            litType: ast.AstLiteralType.Integer,
        }
    }

    validateDeclStmt(decl: ast.IAstDeclStmt): ir.ICell | ir.INet | ir.IPort | ir.IParam {
        let irdecl = (() => {
            switch(decl.declType) {
                case ast.AstDeclType.Const:
                    return ir.Param(decl.identifier.id, null,
                                    decl.identifier.src)
                case ast.AstDeclType.Net:
                    return ir.Net(decl.identifier.id, 1, decl.identifier.src)
                case ast.AstDeclType.Cell:
                    return ir.Cell(decl.identifier.id, '', decl.identifier.src)
                case ast.AstDeclType.Analog:
                    return ir.Port(decl.identifier.id, 'analog', 1,
                                   decl.identifier.src)
                case ast.AstDeclType.Input:
                    return ir.Port(decl.identifier.id, 'input', 1,
                                   decl.identifier.src)
                case ast.AstDeclType.Output:
                    return ir.Port(decl.identifier.id, 'output', 1,
                                   decl.identifier.src)
                case ast.AstDeclType.Inout:
                    return ir.Port(decl.identifier.id, 'inout', 1,
                                   decl.identifier.src)
            }
        })()

        if (irdecl.tag === 'param') {
            for (let attr of decl.attributes) {
                this.logger.error(`Constant declaration can not have attributes.`,
                                  attr.src || emptySrcLoc)
            }
        } else {
            irdecl.attrs = this.validateAttributes(decl.attributes)
        }

        this.symbolTable.declareSymbol(decl.identifier.id, irdecl)
        //TODO evalExpr(decl.width)

        return irdecl
    }

    validateWith(withStmt: ast.IAstWithStmt) {
        // TODO let decl = this.symbolTable.resolveFQNDecl()
        //withStmt.scope
    }

    validateAssign(assign: ast.IAstAssignStmt) {
        //this.validateExpression(assign.lhs)
        //this.validateExpression(assign.rhs)
        //this.checkTypesEqual(lhsTy, rhsTy, assign.lhs.src || emptySrcLoc)
    }

    validateApplyDict(applyDict: ast.IAstApplyDictStmt) {
        //this.validateExpression(applyDict.expr)
        // TODO check dict
    }

    validateExpression(expr: ast.AstExpr) {
        switch (expr.ast) {
            case Ast.Literal:
                this.validateLiteral(expr as ast.IAstLiteral)
                break
            case Ast.Identifier:
                this.validateIdentifier(expr as ast.IAstIdentifier)
                break
            case Ast.Ref:
                this.validateRef(expr as ast.IAstReference)
                break
            case Ast.Tuple:
                this.validateTuple(expr as ast.IAstTuple)
                break
            case Ast.ModInst:
                this.validateModInst(expr as ast.IAstModInst)
                break
            case Ast.AnonymousMod:
                this.validateAnonymousMod(expr as ast.IAstAnonymousModule)
                break
            case Ast.BinOp:
                this.validateBinOp(expr as ast.IAstBinOp)
                break
            default:
                throw new Error(`Programmer error at 'checkExpression'`)
        }
    }

    validateLiteral(lit: ast.IAstLiteral) {
        if (lit.litType === ast.AstLiteralType.BitVector) {
            let parts = lit.value.split("'")
            const width: number = parseInt(parts[0])
            const value: string = parts[1]
            if (value.length !== width) {
                this.logger.error(
                    `Constant literal value doesn't have size '${width}'.`,
                    lit.src)
            }
        }
    }

    validateRef(ref: ast.IAstReference) {
        this.validateIdentifier(ref.identifier)

        /*if (!(ref.from < sig.width && ref.to < sig.width)) {
            this.errors.push({
                message: `Out of bounds access of '${ref.identifier.id}'.`,
                src: ref.src || emptySrcLoc,
                severity: DiagnosticSeverity.Error,
                errorType: DiagnosticType.TypeCheckingError,
            })
        }

        let width = ref.to - ref.from + 1
        if (width < 1) {
            this.errors.push({
                message: `Reversed bounds on '${ref.identifier.id}'.`,
                src: ref.src || emptySrcLoc,
                severity: DiagnosticSeverity.Error,
                errorType: DiagnosticType.TypeCheckingError,
            })
        }*/
    }

    validateTuple(concat: ast.IAstTuple) {
        let hasCell = false
        for (let expr of concat.expressions) {
            this.validateExpression(expr)

            /*if (eTy.ty === Type.Cell) {
                this.logger.error(`Concatenation contains a cell.`,
                    concat.src)
                return { width: 0, ty: Type.Cell }
            }
            if (eTy.ty !== Type.Signal) {
                ty = eTy.ty
            }*/
        }
    }

    validateModInst(cell: ast.IAstModInst) {
        /*let mod = this.symbolTable.resolveSymbol(cell.module)

        if (mod) {
            for (let param of cell.parameters) {
                let pdecl = null
                if (param.identifier.id.startsWith('__')) {
                    const i = parseInt(param.identifier.id.substring(2))
                    pdecl = mod.parameters[i - 1]
                } else {
                    for (let modpdecl of mod.parameters) {
                        if (param.identifier.id === modpdecl.identifier.id) {
                            pdecl = modpdecl
                        }
                    }
                }
                if (!pdecl) {
                    this.logger.error(
                        `Module '${mod.identifier.id}' doesn't have ` +
                            `parameter '${param.identifier.id}'.`,
                        param.identifier.src || param.value.src)
                }

                // TODO const eval param.value
                // allTypeHandlers[pdecl.identifier.id].isValid()
            }

            // Only enter scope once to avoid multiple error messages
            this.symbolTable.enterScope(cell.module)
            for (let entry of cell.dict.entries) {
                // TODO check lhs and rhs type match
                let lhsTy = this.validateIdentifier(entry.identifier)

                // Check that assignment is to a port
                // Make sure unresolved symbol error only gets emitted once
                /*if (lhsTy.width) {
                    let decl = this.symbolTable.resolveDeclaration(entry.identifier)
                    if (decl && decl.declType === AstDeclType.Net) {
                        this.logger.error(`Illegal assignment to internal net ` +
                                `'${decl.identifier.id}' in '${cell.module.id}'.`,
                            entry.identifier.src)
                    }
                }
            }
            this.symbolTable.exitScope()
        }

        for (let entry of cell.dict.entries) {
            this.validateExpression(entry.expr)
        }*/
    }

    validateDict(mod: ast.IAstModule, dict: ast.IAstDict) {
        // Only enter scope once to avoid multiple error messages
        this.symbolTable.enterScope(mod.identifier.id)
        for (let entry of dict.entries) {
            // TODO check lhs and rhs type match
            let lhsTy = this.validateIdentifier(entry.identifier)

            // Check that assignment is to a port
            // Make sure unresolved symbol error only gets emitted once
            /*if (lhsTy.width) {
                let decl = this.symbolTable.resolveDeclaration(entry.identifier)
                if (decl && decl.declType === AstDeclType.Net) {
                    this.logger.error(
                        `Illegal assignment to internal net ` +
                            `'${decl.identifier.id}' in '${mod.identifier.id}'.`,
                        entry.identifier.src)
                }
            }*/
        }
        if (dict.star) {
        }
        this.symbolTable.exitScope()

        for (let entry of dict.entries) {
            this.validateExpression(entry.expr)
        }
    }

    validateAnonymousMod(mod: ast.IAstAnonymousModule) {

    }

    validateBinOp(op: ast.IAstBinOp) {

    }
}
