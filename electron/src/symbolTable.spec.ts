import { expect } from 'chai'
import * as ast from './ast'
import { DiagnosticCollector, emptySrcLoc } from './diagnostic'
import { SymbolTable } from './symbolTable'

describe('Symbol Table', () => {
    const dc = new DiagnosticCollector()
    const st = new SymbolTable<ast.IModule | ast.IPort>(dc.toPublisher())
    const A = ast.Module('A')

    it('should return null when resolving undeclared symbol', () => {
        expect(st.resolveSymbol(A.name)).to.equal(null)
    })

    it('should return IAstSymbol when resolving a declared symbol', () => {
        st.declareSymbol(A.name, A)
        expect(st.resolveSymbol(A.name)).to.equal(A)
    })

    it('should keep track of conflicting symbols', () => {
        st.declareSymbol(A.name, A)
        expect(st.resolveSymbol(A.name)).to.equal(A)
    })

    const B = ast.Module('B')
    const a = ast.Port(ast.Ident('a'), 'output')

    it('should handle scopes', () => {
        st.declareSymbol(B.name, B)
        st.enterScope(B.name)
        st.declareSymbol(a.ident.id, a)
        expect(st.resolveSymbol(a.ident.id)).to.equal(a)
        st.exitScope()
        expect(st.resolveSymbol(a.ident.id)).to.equal(null)
    })
})
