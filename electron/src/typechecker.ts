import { resolve, dirname } from 'path'
import { existsSync } from 'fs'
import { IDiagnostic, DiagnosticSeverity, DiagnosticType,
         emptySrcLoc, ISrcLoc } from './diagnostic'
import { SymbolTable } from './symbolTable'
import { IAstDesign, IAstImport, IAstModule, IAstAttribute, IAstDeclStmt, IAstFQN,
         IAstAssignStmt, AstExpr, AstDeclType, IAstIdentifier,
         IAstReference, IAstTuple, IAstLiteral, IAstModInst,
         Ast, AstLiteralType } from './ast'
import { allAttributes } from './attributes'
import { compileDeclaration } from './declaration'

enum Type {
    Signal,
    Cell,
    DigitalSignal,
}

interface IType {
    width: number,
    ty: Type,
}

export class TypeChecker {
    public errors: IDiagnostic[] = []
    private symbolTable: SymbolTable = new SymbolTable()

    typeCheck(path: string, design: IAstDesign) {
        let dir = dirname(path)

        const modules = this.resolveImports(dir, design.imports)
            .concat(design.modules)

        for (let mod of modules) {
            this.checkModule(mod)
        }

        // get errors from symbol table
        this.errors = this.symbolTable.getErrors().concat(this.errors)
    }

    resolveImports(dir: string, imports: IAstImport[]): IAstModule[] {
        let dmodules: IAstModule[] = []

        for (let imp of imports) {
            if (imp.package.startsWith('.')) {
                const absPath = resolve(dir + '/' + imp.package + '.lec')
                const absDeclPath = resolve(dir + '/' + imp.package + '.d.lec')
                if (!existsSync(absPath)) {
                    this.errors.push({
                        message: `File ${absPath} doesn't exist.`,
                        src: imp.src || emptySrcLoc,
                        severity: DiagnosticSeverity.Error,
                        errorType: DiagnosticType.TypeCheckingError,
                    })
                }

                const {ast, errors} = compileDeclaration(absPath, absDeclPath)
                if (ast) {
                    for (let dmod of ast.modules) {
                        for (let ident in imp.identifiers) {
                            if (dmod.identifier.id === ident) {
                                dmodules.push(dmod)
                            }
                        }
                    }
                }
                this.errors = this.errors.concat(errors)
            } else {
                // TODO resolve external modules from packages
                this.errors.push({
                    message: 'Package resolution unsupported',
                    src: imp.src || emptySrcLoc,
                    severity: DiagnosticSeverity.Warning,
                    errorType: DiagnosticType.TypeCheckingError,
                })
            }
        }
        return dmodules
    }

    checkModule(mod: IAstModule) {
        this.symbolTable.declareModule(mod)
        this.symbolTable.enterScope(mod.identifier)

        this.checkAttributes(mod.attributes)

        if (mod.identifier.id[0].toUpperCase() !== mod.identifier.id[0]) {
            this.errors.push({
                message: `Module '${mod.identifier.id}' starts with a lowercase letter.`,
                src: mod.identifier.src || emptySrcLoc,
                severity: DiagnosticSeverity.Warning,
                errorType: DiagnosticType.TypeCheckingError,
            })
        }

        for (let stmt of mod.statements) {
            if (stmt.ast === Ast.Decl) {
                this.checkDeclaration(stmt as IAstDeclStmt)
            } else {
                    if (mod.declaration) {
                        this.errors.push({
                            message: `Declared module '${mod.identifier.id}' contains assignments.`,
                            src: mod.identifier.src || emptySrcLoc,
                            severity: DiagnosticSeverity.Error,
                            errorType: DiagnosticType.TypeCheckingError,
                        })
                    }

                if (stmt.ast === Ast.Assign) {
                    this.checkAssignment(stmt as IAstAssignStmt)
                }

                    /*if ((stmt as IAstFullyQualifiedName).fqn) {
                      this.checkFQN(stmt as IAstFullyQualifiedName)
                      }*/
            }
            }

        this.symbolTable.exitScope()
    }

    checkAttributes(attrs: IAstAttribute[]) {
        for (let attr of attrs) {
            if (attr.name.id in allAttributes) {
                for (let e of allAttributes[attr.name.id].validateParameters(attr)) {
                    this.errors.push(e)
                }
            } else {
                this.errors.push({
                    message: `Unknown attribute '${attr.name.id}'.`,
                    src: attr.name.src || emptySrcLoc,
                    severity: DiagnosticSeverity.Error,
                    errorType: DiagnosticType.TypeCheckingError,
                })
            }
        }
    }

    checkDeclaration(decl: IAstDeclStmt) {
        this.symbolTable.declareVariable(decl)
        //this.checkAttributes(decl.attributes)
    }

    checkAssignment(assign: IAstAssignStmt) {
        let lhsTy = this.checkExpression(assign.lhs)
        let rhsTy = this.checkExpression(assign.rhs)
        this.checkTypesEqual(lhsTy, rhsTy, assign.lhs.src || emptySrcLoc)
    }

    checkTypesEqual(ty1: IType, ty2: IType, src: ISrcLoc) {
        if (!ty1.width || !ty2.width) {
            return
        }
        if (ty1.width != ty2.width) {
            this.errors.push({
                message: `Width doesn't match`,
                src,
                severity: DiagnosticSeverity.Error,
                errorType: DiagnosticType.TypeCheckingError,
            })
        }
        if (ty1.ty == Type.Cell || ty2.ty == Type.Cell) {
            if (ty1.ty != ty2.ty) {
                this.errors.push({
                    message: `Assigning a cell to a net`,
                    src,
                    severity: DiagnosticSeverity.Error,
                    errorType: DiagnosticType.TypeCheckingError,
                })
            }
        }
    }

    checkFQN(fqn: IAstFQN) {
        // TODO
    }

    checkExpression(expr: AstExpr): IType {
        switch (expr.ast) {
            case Ast.Literal:
                return this.checkConstant(expr as IAstLiteral)
            case Ast.Identifier:
                return this.checkIdentifier(expr as IAstIdentifier)
            case Ast.Ref:
                return this.checkReference(expr as IAstReference)
            case Ast.Tuple:
                return this.checkConcat(expr as IAstTuple)
            case Ast.ModInst:
                return this.checkCell(expr as IAstModInst)
            case Ast.AnonymousMod:
                return {width: 0, ty: Type.Cell} // TODO
            case Ast.BinOp:
                return {width: 0, ty: Type.Signal} // TODO
            default:
                throw new Error(`Programmer error at 'checkExpression'`)
        }
    }

    checkConstant(constant: IAstLiteral): IType {
        return {width: 0, ty: Type.DigitalSignal} // TODO
        let parts = constant.value.split("'")
        const width: number = parseInt(parts[0])
        const value: string = parts[1]
        if (value.length !== width) {
            this.errors.push({
                message: `Constant literal value doesn't have size '${width}'.`,
                src: constant.src || emptySrcLoc,
                severity: DiagnosticSeverity.Error,
                errorType: DiagnosticType.TypeCheckingError,
            })
            return { width: 0, ty: Type.DigitalSignal }
        }
        return { width, ty: Type.DigitalSignal }
    }

    checkIdentifier(ident: IAstIdentifier): IType {
        let decl = this.symbolTable.resolveDeclaration(ident)
        //let width = 0
        let ty = Type.Signal
        if (decl) {
            //width = decl.width
            if (decl.declType === AstDeclType.Cell) {
                ty = Type.Cell
            }
        }
        return { width: 0, ty }
    }

    checkReference(ref: IAstReference): IType {
        let sig = this.checkIdentifier(ref.identifier)
        if (!sig.width) {
            return sig
        }

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

        return { width: 0, ty: sig.ty }
    }

    checkConcat(concat: IAstTuple): IType {
        let hasCell = false
        let ty = Type.Signal
        let width = 0
        for (let expr of concat.expressions) {
            let eTy = this.checkExpression(expr)
            if (!eTy.width) {
                return eTy
            }
            width += eTy.width
            if (eTy.ty === Type.Cell) {
                this.errors.push({
                    message: `Concatenation contains a cell.`,
                    src: concat.src || emptySrcLoc,
                    severity: DiagnosticSeverity.Error,
                    errorType: DiagnosticType.TypeCheckingError,
                })
                return { width: 0, ty: Type.Cell }
            }
            if (eTy.ty !== Type.Signal) {
                ty = eTy.ty
            }
        }
        return { width, ty }
    }

    checkCell(cell: IAstModInst): IType {
        let mod = this.symbolTable.resolveModule(cell.module)

        // TODO check parameters

        for (let entry of cell.dict.entries) {
            // TODO check lhs and rhs type match
            this.symbolTable.enterScope(cell.module)
            let lhsTy = this.checkIdentifier(entry.identifier)

            // Check that assignment is to a port
            // Make sure unresolved symbol error only gets emitted once
            if (lhsTy.width) {
                let decl = this.symbolTable.resolveDeclaration(entry.identifier)
                if (decl && decl.declType === AstDeclType.Net) {
                    this.errors.push({
                        message: `Illegal assignment to internal net '${decl.identifier.id}' in '${cell.module.id}'.`,
                        src: entry.identifier.src || emptySrcLoc,
                        severity: DiagnosticSeverity.Error,
                        errorType: DiagnosticType.TypeCheckingError,
                    })
                }
            }
            this.symbolTable.exitScope()

            let rhsTy = this.checkExpression(entry.expr)

            this.checkTypesEqual(lhsTy, rhsTy, entry.identifier.src || emptySrcLoc)
        }

        return { width: 0 /*cell.width*/, ty: Type.Cell }
    }
}
