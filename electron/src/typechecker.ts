import { resolve } from 'path'
import { IDiagnostic, DiagnosticSeverity, DiagnosticType,
         emptySrcLoc } from './diagnostic'
import { SymbolTable } from './symbolTable'
import { IAstDesign, IAstAttribute, IAstDeclaration, IAstFullyQualifiedName, IAstAssignment } from './ast'
import { allAttributes } from './attributes'

export class TypeChecker {
    public errors: IDiagnostic[] = []
    private symbolTable: SymbolTable = new SymbolTable()

    typeCheck(design: IAstDesign): IDiagnostic[] {
        for (let imp of design.imports) {
            this.symbolTable.declareExternalModule(imp)

            if (imp.package.value.startsWith('.')) {
                imp.package.value = resolve(imp.package.value)
                // TODO resolve External Modules
            } else {
                // TODO
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
                    message: 'Module names should start with uppercase letters',
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
                            message: 'Declared modules can only contain declarations',
                            src: emptySrcLoc, // TODO needs src information
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
        return  this.symbolTable.getErrors().concat(this.errors)
    }

    checkAttributes(attrs: IAstAttribute[]) {
        for (let attr of attrs) {
            if (attr.name.id in allAttributes) {
                for (let e of allAttributes[attr.name.id].validateParameters(attr)) {
                    this.errors.push(e)
                }
            } else {
                this.errors.push({
                    message: 'Unknown attribute',
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
        // TODO
    }

    checkFQN(fqn: IAstFullyQualifiedName) {
        // TODO
    }
}
