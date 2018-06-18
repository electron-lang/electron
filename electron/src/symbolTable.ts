import { IAstSymbol, IAstIdentifier, IAstModule, IAstImport,
         IAstDeclaration, AstType} from './ast'
import { ISrcLoc, emptySrcLoc, DiagnosticType, DiagnosticSeverity,
         IDiagnostic } from './diagnostic'

enum SymbolType {
    Module,
    ExternalModule,
    Declaration,
}

export interface ISymbolTable {
    [symbol: string]: ISymbolTableEntry,
}

export interface ISymbolTableEntry {
    ast: IAstSymbol
    ty: SymbolType
    symbols?: ISymbolTable
}

export class SymbolTable {
    private symbols: ISymbolTable = {}
    private scopes: ISymbolTable[] = []
    conflictingSymbols: {[symbol: string]: ISrcLoc[]} = {}
    unresolvedSymbols: IAstIdentifier[] = []

    constructor() {
        this.scopes.push(this.symbols)
    }

    private currentScope(): ISymbolTable {
        return this.scopes[this.scopes.length - 1]
    }

    enterScope(ident: IAstIdentifier) {
        let stentry = this.resolveSymbol(ident)
        if (stentry) {
            stentry.symbols = stentry.symbols || {}
            this.scopes.push(stentry.symbols)
        } else {
            this.scopes.push({})
        }
    }

    exitScope() {
        this.scopes.pop()
    }

    private pushConflictingIdentifier(ident: IAstIdentifier) {
        if (!(ident.id in this.conflictingSymbols)) {
            this.conflictingSymbols[ident.id] = []
        }
        this.conflictingSymbols[ident.id].push(ident.src || emptySrcLoc)
    }

    private isRootScope(): boolean {
        return this.scopes.length === 1
    }

    private checkIdentifier(ident: IAstIdentifier): boolean {
        const scope = this.currentScope()
        if (ident.id in scope) {
            this.pushConflictingIdentifier(ident)
            this.pushConflictingIdentifier(scope[ident.id].ast.identifier)
            return false
        }
        return true
    }

    private declareSymbol(ident: IAstIdentifier, symbol: ISymbolTableEntry) {
        this.currentScope()[ident.id] = symbol
    }

    declareModule(mod: IAstModule) {
        if (this.checkIdentifier(mod.identifier)) {
            if (!this.isRootScope()) {
                throw new Error('Programmer Error: Not root scope')
            }
            this.declareSymbol(mod.identifier, { ast: mod, ty: SymbolType.Module })
        }
    }

    declareExternalModule(imp: IAstImport) {
        if (this.checkIdentifier(imp.identifier)) {
            if (!this.isRootScope()) {
                throw new Error('Programmer Error: Not root scope')
            }
            this.declareSymbol(imp.identifier, {
                ast: imp,
                ty: SymbolType.ExternalModule
            })
        }
    }

    declareVariable(decl: IAstDeclaration) {
        if (this.checkIdentifier(decl.identifier)) {
            if (this.isRootScope()) {
                throw new Error('Programmer Error: Root scope')
            }
            this.declareSymbol(decl.identifier, {
                ast: decl,
                ty: SymbolType.Declaration
            })
        }
    }

    private resolveSymbol(ident: IAstIdentifier): ISymbolTableEntry | null {
        for (let i = 0; i < this.scopes.length; i++) {
            const scopeIdx = this.scopes.length - 1 - i
            if (ident.id in this.scopes[scopeIdx]) {
                return this.scopes[scopeIdx][ident.id]
            }
        }
        this.unresolvedSymbols.push(ident)
        return null
    }

    resolveDeclaration(ident: IAstIdentifier): IAstDeclaration | null {
        const stentry = this.resolveSymbol(ident)
        if (stentry) {
            if (stentry.ty === SymbolType.Declaration) {
                return stentry.ast as IAstDeclaration
            }
        }
        return null
    }

    resolveModule(ident: IAstIdentifier): IAstModule | null {
        const stentry = this.resolveSymbol(ident)
        if (stentry) {
            if (stentry.ty === SymbolType.Module) {
                return stentry.ast as IAstModule
            } else if (stentry.ty === SymbolType.ExternalModule) {
                // TODO
                return null
            }
        }
        return null
    }

    getErrors(): IDiagnostic[] {
        let conflictErrors: IDiagnostic[] = []
        for (let symbol in this.conflictingSymbols) {
            const newErrors = this.conflictingSymbols[symbol]
                .map((src: ISrcLoc) => {
                    return {
                        message: 'Conflicting identifiers ' + symbol,
                        src,
                        severity: DiagnosticSeverity.Error,
                        errorType: DiagnosticType.SymbolTableError,
                    }
                })
            conflictErrors = conflictErrors.concat(newErrors)
        }

        const unresolvedErrors = this.unresolvedSymbols
            .map((ident: IAstIdentifier) => {
                return {
                    message: 'Undeclared identifier ' + ident.id,
                    src: ident.src || emptySrcLoc,
                    severity: DiagnosticSeverity.Error,
                    errorType: DiagnosticType.SymbolTableError,
                }
            })
        return conflictErrors.concat(unresolvedErrors)
    }
}
