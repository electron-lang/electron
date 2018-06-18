import { resolve, dirname } from 'path'
import { existsSync } from 'fs'
import { IDiagnostic, DiagnosticSeverity, DiagnosticType,
         emptySrcLoc, ISrcLoc } from './diagnostic'
import { SymbolTable } from './symbolTable'
import { IAstDesign, IAstAttribute, IAstDeclaration, IAstFullyQualifiedName,
         IAstAssignment, AstExpr, IAstType, AstType, IAstIdentifier, IAstReference,
    IAstConcat, IAstLiteral, IAstCell, AstLiteralType } from './ast'
import { allAttributes } from './attributes'

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
        for (let imp of design.imports) {
            this.symbolTable.declareExternalModule(imp)

            if (imp.package.value.startsWith('.')) {
                const absPath = resolve(dir + '/' + imp.package.value + '.lec')
                if (!existsSync(absPath)) {
                    this.errors.push({
                        message: `File ${absPath} doesn't exist.`,
                        src: imp.package.src || emptySrcLoc,
                        severity: DiagnosticSeverity.Error,
                        errorType: DiagnosticType.TypeCheckingError,
                    })
                }
                imp.package.value = absPath
                // TODO resolve external modules
            } else {
                // TODO resolve external modules from packages
                this.errors.push({
                    message: 'Package resolution unsupported',
                    src: imp.package.src || emptySrcLoc,
                    severity: DiagnosticSeverity.Warning,
                    errorType: DiagnosticType.TypeCheckingError,
                })
            }
        }

        for (let mod of design.modules) {
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
                if ((stmt as IAstDeclaration).identifier) {
                    this.checkDeclaration(stmt as IAstDeclaration)
                } else {
                    if (mod.declaration) {
                        this.errors.push({
                            message: `Declared module '${mod.identifier.id}' contains assignments.`,
                            src: mod.identifier.src || emptySrcLoc,
                            severity: DiagnosticSeverity.Error,
                            errorType: DiagnosticType.TypeCheckingError,
                        })
                    }

                    if ((stmt as IAstAssignment).lhs) {
                        this.checkAssignment(stmt as IAstAssignment)
                    }

                    if ((stmt as IAstFullyQualifiedName).fqn) {
                        this.checkFQN(stmt as IAstFullyQualifiedName)
                    }
                }
            }

            this.symbolTable.exitScope()
        }

        // get errors from symbol table
        this.errors = this.symbolTable.getErrors().concat(this.errors)
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

    checkDeclaration(decl: IAstDeclaration) {
        this.symbolTable.declareVariable(decl)
        this.checkAttributes(decl.attributes)
    }

    checkAssignment(assign: IAstAssignment) {
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

    checkFQN(fqn: IAstFullyQualifiedName) {
        // TODO
    }

    checkExpression(expr: AstExpr): IType {
        if ((expr as IAstLiteral).value) {
            return this.checkConstant(expr as IAstLiteral)
        } else if ((expr as IAstIdentifier).id) {
            return this.checkIdentifier(expr as IAstIdentifier)
        } else if ((expr as IAstReference).identifier) {
            return this.checkReference(expr as IAstReference)
        } else if ((expr as IAstConcat).expressions) {
            return this.checkConcat(expr as IAstConcat)
        } else if ((expr as IAstCell).cellType) {
            return this.checkCell(expr as IAstCell)
        } else {
            throw new Error("Programmer error at 'checkExpression'")
        }
    }

    checkConstant(constant: IAstLiteral): IType {
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
        let width = 0
        let ty = Type.Signal
        if (decl) {
            width = decl.type.width
            if (decl.type.ty === AstType.Cell) {
                ty = Type.Cell
            }
        }
        return { width, ty }
    }

    checkReference(ref: IAstReference): IType {
        let sig = this.checkIdentifier(ref.identifier)
        if (!sig.width) {
            return sig
        }

        if (!(ref.from < sig.width && ref.to < sig.width)) {
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
        }

        return { width, ty: sig.ty }
    }

    checkConcat(concat: IAstConcat): IType {
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

    checkCell(cell: IAstCell): IType {
        let mod = this.symbolTable.resolveModule(cell.cellType)

        // TODO check parameters

        for (let assign of cell.assignments) {
            // TODO check lhs and rhs type match
            this.symbolTable.enterScope(cell.cellType)
            let lhsTy = this.checkIdentifier(assign.lhs as IAstIdentifier)

            // Check that assignment is to a port
            // Make sure unresolved symbol error only gets emitted once
            if (lhsTy.width) {
                let decl = this.symbolTable.resolveDeclaration(
                    assign.lhs as IAstIdentifier)
                if (decl && decl.type.ty === AstType.Net) {
                    this.errors.push({
                        message: `Illegal assignment to internal net '${decl.identifier.id}' in '${cell.cellType.id}'.`,
                        src: assign.lhs.src || emptySrcLoc,
                        severity: DiagnosticSeverity.Error,
                        errorType: DiagnosticType.TypeCheckingError,
                    })
                }
            }
            this.symbolTable.exitScope()

            let rhsTy = this.checkExpression(assign.rhs)

            this.checkTypesEqual(lhsTy, rhsTy, assign.lhs.src || emptySrcLoc)
        }

        return { width: cell.width, ty: Type.Cell }
    }
}
