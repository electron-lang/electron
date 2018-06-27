import { ISrcLoc, emptySrcLoc, DiagnosticPublisher,
         IDiagnostic } from './diagnostic'

interface ISymbolTable<Declarable> {
    [key: string]: IScope<Declarable>
}

export interface IScope<Declarable> {
    [symbol: string]: IEntry<Declarable>,
}

interface IEntry<Declarable> {
    sym: ISymbol
    decl: Declarable
}

interface ISymbol {
    id: string,
    src: ISrcLoc,
}

export class SymbolTable<Declarable> {
    private scopes: ISymbolTable<Declarable> = {}
    private currScope: IScope<Declarable> = {}
    private scopeStack: IScope<Declarable>[] = []

    constructor(private logger: DiagnosticPublisher) {}

    enterScope(scope?: string | IScope<Declarable>) {
        this.scopeStack.push(this.currScope)

        if (typeof scope === 'undefined') {
            this.currScope = {}
        } else if (typeof scope === 'string') {
            if (!(scope in this.scopes)) {
                this.scopes[scope] = {}
            }
            this.currScope = this.scopes[scope]
        } else {
            this.currScope = scope
        }
    }

    exitScope(): IScope<Declarable> {
        const prev = this.currScope
        const scope = this.scopeStack.pop()
        if (scope) {
            this.currScope = scope
        }
        return prev
    }

    lookup(symbol: ISymbol): Declarable | null {
        if (symbol.id in this.currScope) {
            return this.currScope[symbol.id].decl
        }

        this.logger.error(`Unknown symbol '${symbol.id}'`, symbol.src)
        return null
    }


    define(symbol: ISymbol, decl: Declarable): boolean {
        if (symbol.id in this.currScope) {
            this.logger.error(`Conflicting identifiers '${symbol.id}'.`,
                              symbol.src)
            this.logger.error(`Conflicting identifiers '${symbol.id}'.`,
                              this.currScope[symbol.id].sym.src)
            return false
        }
        this.currScope[symbol.id] = { sym: symbol, decl }
        return true
    }

    dump() {
        console.log('All scopes:')
        console.log(JSON.stringify(this.scopes))
        console.log('Scope stack:')
        console.log(JSON.stringify(this.scopeStack))
    }
}
