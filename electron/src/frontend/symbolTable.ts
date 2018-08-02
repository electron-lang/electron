import { FileInfo } from '../file'
import { Logger, ISrcLoc, SrcLoc } from '../diagnostic'

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

export interface ISymbol {
    id: string,
    src: ISrcLoc,
}

export function Symbol(id: string, src?: ISrcLoc): ISymbol {
    return { id, src: src || SrcLoc.empty() }
}

export class SymbolTable<Declarable> {
    protected logger: Logger
    private scopes: ISymbolTable<Declarable> = {}
    private currScope: IScope<Declarable> = {}
    private scopeStack: IScope<Declarable>[] = []

    constructor(info: FileInfo) {
        this.logger = info.logger
    }

    enterScope(scope?: string) {
        this.scopeStack.push(this.currScope)

        if (scope) {
            if (!(scope in this.scopes)) {
                this.scopes[scope] = {}
            }
            this.currScope = this.scopes[scope]
        } else {
            this.currScope = {}
        }
    }

    exitScope() {
        const scope = this.scopeStack.pop()
        if (scope) {
            this.currScope = scope
        }
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
}
