import { expect } from 'chai'
import { IAstModule, IAstDeclaration, AstType } from './ast'
import { emptySrcLoc } from './diagnostic'
import { SymbolTable } from './symbolTable'

function makeModule(id: string): IAstModule {
    return {
        identifier: { id, src: emptySrcLoc },
        attributes: [],
        exported: false,
        declaration: false,
        statements: [],
    }
}

function makeOutput(id: string): IAstDeclaration {
    return {
        attributes: [],
        identifier: { id, src: emptySrcLoc },
        'type': { ty: AstType.Output, width: 1 },
    }
}

describe('Symbol Table', () => {

    const st = new SymbolTable()
    const A = makeModule('A')

    it('should return null when resolving undeclared symbol', () => {
        expect(st.resolveSymbol(A.identifier)).to.equal(null)
    })

    it('should return IAstSymbol when resolving a declared symbol', () => {
        st.declareModule(A)
        expect(st.resolveSymbol(A.identifier)).to.equal(A)
    })

    it('should keep track of conflicting symbols', () => {
        st.declareModule(A)
        expect(st.resolveSymbol(A.identifier)).to.equal(A)
        expect(st.conflictingSymbols[A.identifier.id]).to.deep.equal([
            A.identifier.src, A.identifier.src
        ])
    })

    const B = makeModule('B')
    const a = makeOutput('a')

    it('should handle scopes', () => {
        st.declareModule(B)
        st.enterScope(B.identifier)
        st.declareVariable(a)
        expect(st.resolveSymbol(a.identifier)).to.equal(a)
        st.exitScope()
        expect(st.resolveSymbol(a.identifier)).to.equal(null)
    })
})
