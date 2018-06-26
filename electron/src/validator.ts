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

    validate(path: string, design: ast.IDesign) {
        const dir = dirname(path)

        this.resolveImports(dir, design.imports)

        for (let mod of design.modules) {
            this.validateModule(mod)
        }

        return this.ir
    }

    resolveImports(dir: string, imports: ast.IImport[]) {
        for (let imp of imports) {
            if (imp.package.startsWith('.')) {
                const absPath = resolve(dir + '/' + imp.package + '.lec')
                if (!existsSync(absPath)) {
                    this.logger.error(`File ${absPath} doesn't exist.`, imp.src)
                } else {
                    let f = new File(new DiagnosticLogger(), absPath, null)
                    const modules = f.extractDeclarations()
                    for (let ident of imp.ids) {
                        let foundMod = false
                        for (let dmod of modules) {
                            if (dmod.name === ident.id) {
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

    validateModule(mod: ast.IModule) {
        let irmod = ir.Module(mod.name)
        irmod.src = mod.src || emptySrcLoc
        this.ir.push(irmod)

        this.symbolTable.declareSymbol(mod.name, irmod)
        this.symbolTable.enterScope(mod.name)

        irmod.attrs = this.validateAttributes(mod.attrs)

        if (mod.declaration) {
            if (mod.applyDicts.length + mod.assigns.length + mod.cells.length +
                mod.consts.length + mod.nets.length + mod.withs.length > 0) {
                this.logger.error(
                    `Declared module '${mod.name}' contains assignments.`,
                    mod.src)
            }
        }

        if (mod.name[0].toUpperCase() !== mod.name[0]) {
            this.logger.warn(
                `Module '${mod.name}' starts with a lowercase letter.`,
                mod.src)
        }

        this.validateParamDecls(mod.params)

        for (let setattr of mod.setAttrs) {
            this.validateSetAttr(setattr)
        }

        for (let apply of mod.applyDicts) {
            this.validateApplyDict(apply)
        }

        for (let w of mod.withs) {
            this.validateWith(w)
        }

        for (let c of mod.consts) {
            this.validateConst(c)
        }

        for (let p of mod.ports) {
            this.validatePort(p)
        }

        for (let n of mod.nets) {
            this.validateNet(n)
        }

        for (let c of mod.cells) {
            this.validateCell(c)
        }

        for (let assign of mod.assigns) {
            this.validateAssign(assign)
        }

        this.symbolTable.exitScope()
    }

    validateAttributes(attrs: ast.IAttr[]): ir.IAttr[] {
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

    validateParamDecls(params: ast.IParamDecl[]) {
        /*for (let param of params) {
            let irparam = ir.Param(param.name.id, null,
                                   param.name.src)
            this.symbolTable.declareSymbol(param.name.toString(), irparam)

            if (param.name.id.toUpperCase() !== param.name.id) {
                this.logger.warn(`Parameter '${param.name.id}' contains ` +
                                 `lowercase letters.`,
                                 param.name.src)
            }

            if (!(param.ty.id in allTypeHandlers)) {
                this.logger.error(`Unknown parameter type '${param.ty.id}'`,
                                  param.ty.src)
            }
        }*/
    }

    validateIdentifier(ident: ast.IIdent): Declarable | null {
        let irdecl = this.symbolTable.resolveSymbol(ident.id)
        if (!irdecl) {
            this.logger.error(`Unknown symbol '${ident.id}'`, ident.src)
        }
        return irdecl
    }

    validateFQN(fqn: ast.IFQN): Declarable | null {
        let irdecl = null

        for (let i = 0; i < fqn.ids.length - 2; i++) {
            this.symbolTable.enterScope(fqn.ids[i].id)
        }

        irdecl = this.validateIdentifier(fqn.ids[fqn.ids.length - 1])

        for (let i = 0; i < fqn.ids.length - 2; i++) {
            this.symbolTable.exitScope()
        }

        return irdecl
    }

    validateSetAttr(setAttrs: ast.ISetAttr) {
        /*let irattrs = this.validateAttributes(setAttrs.attrs)
        for (let stmt of setAttrs.stmts) {
            this.validateStmt(stmt)
            if (stmt.tag in ['port', 'net', 'cell', 'const']) {
                let irdecl = this.symbolTable.resolveSymbol(stmt.name)
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
        }*/
    }

    validateApplyDict(applyDict: ast.IApplyDict) {
        //this.validateExpression(applyDict.expr)
        // TODO check dict
    }

    validateWith(withStmt: ast.IWith) {
        // TODO let decl = this.symbolTable.resolveFQNDecl()
        //withStmt.scope
    }

    validateConst(c: ast.IConst) {

    }

    validatePort(port: ast.IPort) {

    }

    validateNet(net: ast.INet) {

    }

    validateCell(cell: ast.ICell) {

    }

    validateAssign(assign: ast.IAssign) {
        //this.validateExpression(assign.lhs)
        //this.validateExpression(assign.rhs)
        //this.checkTypesEqual(lhsTy, rhsTy, assign.lhs.src || emptySrcLoc)
    }

    evalExpr(expr: ast.Expr): ast.Expr[] {
        return ast.matchASTExpr({
            Integer: (ast) => [ast],
            String: (ast) => [ast],
            Real: (ast) => [ast],
            Unit: (ast) => [ast],
            Bool: (ast) => [ast],
            BitVector: (ast) => [ast],
            Ident: (ast) => [ast],
            Ref: this.evaluateRef,
            Tuple: this.evaluateTuple,
            ModInst: this.evalModInst,
            AnonMod: this.evalAnonMod,
            BinOp: this.evaluateBinOp,
        })(expr)
    }

    evaluateRef(ref: ast.IRef): ast.Expr[] {
        return []//this.evalIdent(ref.ident)

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

    evaluateTuple(tuple: ast.ITuple): ast.Expr[] {
        return [].concat.apply([], tuple.exprs.map(this.evalExpr))
    }

    evalModInst(cell: ast.IModInst): ast.Expr[] {
        return []
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

    validateDict(mod: ast.IModule, dict: ast.IDict) {
        // Only enter scope once to avoid multiple error messages
        this.symbolTable.enterScope(mod.name)
        for (let entry of dict.entries) {
            // TODO check lhs and rhs type match
            let lhsTy = this.validateIdentifier(entry.ident)

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
            this.evalExpr(entry.expr)
        }
    }

    evalAnonMod(mod: ast.IAnonMod): ast.Expr[] {
        return []
    }

    evaluateBinOp(op: ast.IBinOp): ast.Expr[] {
        let lhs = this.evalExpr(op.lhs)[0]
        let rhs = this.evalExpr(op.rhs)[0]
        let res = 0

        if (lhs.tag === 'integer' && rhs.tag === 'integer') {
            let vl = lhs.value
            let vr = rhs.value

            switch (op.op) {
                case '+':
                    res = vl + vr
                case '-':
                    res = vl - vr
                case '*':
                    res = vl - vr
                case '<<':
                    res = vl << vr
                case '>>':
                    res = vl >> vr
            }
        } else {
            this.logger.error('Binops can only be performed on integers.', op.src)
        }

        return [ast.Integer(res)]
    }
}
