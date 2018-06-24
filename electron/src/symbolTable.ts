import { IAstIdentifier } from './ast'
import { IModule, IPort, INet, IParam } from './backend/ir'
import { ISrcLoc, emptySrcLoc, DiagnosticPublisher,
         IDiagnostic } from './diagnostic'

export interface ISymbolTable<Declarable> {
    [symbol: string]: ISymbolTableEntry<Declarable>,
}

export interface ISymbolTableEntry<Declarable> {
    ir: Declarable
    symbols: ISymbolTable<Declarable>
}

export class SymbolTable<Declarable> {
    private symbols: ISymbolTable<Declarable> = {}
    private scopes: ISymbolTable<Declarable>[] = []

    constructor(private logger: DiagnosticPublisher) {
        this.scopes.push(this.symbols)
    }

    private currentScope(): ISymbolTable<Declarable> {
        return this.scopes[this.scopes.length - 1]
    }

    private resolve(symbol: string): ISymbolTableEntry<Declarable> | null {
        for (let i = 0; i < this.scopes.length; i++) {
            const scopeIdx = this.scopes.length - 1 - i
            if (symbol in this.scopes[scopeIdx]) {
                return this.scopes[scopeIdx][symbol]
            }
        }
        return null
    }

    public resolveSymbol(symbol: string): Declarable | null {
        const entry = this.resolve(symbol)
        if (entry) {
            return entry.ir
        }
        return null
    }

    enterScope(symbol: string) {
        let entry = this.resolve(symbol)
        if (entry) {
            this.scopes.push(entry.symbols)
        } else {
            this.scopes.push({})
        }
    }

    exitScope() {
        this.scopes.pop()
    }

    public declareSymbol(symbol: string, ir: Declarable): boolean {
        const scope = this.currentScope()
        if (symbol in scope) {
            this.logger.error(`Conflicting identifiers '${symbol}'.`,
                              (ir as any)['src'] || emptySrcLoc)
            this.logger.error(`Conflicting identifiers '${symbol}'.`,
                              (scope[symbol].ir as any)['src'] || emptySrcLoc)
            return false
        }
        scope[symbol] = { ir, symbols: {}}
        return true
    }
}
