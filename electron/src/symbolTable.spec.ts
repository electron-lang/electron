import { expect } from 'chai'
import * as ast from './ast'
import { DiagnosticCollector, emptySrcLoc } from './diagnostic'
import { SymbolTable } from './symbolTable'

describe('Symbol Table', () => {
    const dc = new DiagnosticCollector()
    const st = new SymbolTable<ast.IPort>(
        dc.toPublisher('symbolTable.spec.ts', []))

    const a = ast.Port(ast.Ident('a'), 'output')
    const b = ast.Port(ast.Ident('b'), 'output')

    st.enterScope('A')

    it('should return null when resolving undeclared symbol', () => {
        expect(st.lookup(a.ident)).to.equal(null)
    })

    it('should return IAstSymbol when resolving a declared symbol', () => {
        st.define(a.ident, a)
        expect(st.lookup(a.ident)).to.equal(a)
    })

    it('should keep track of conflicting symbols', () => {
        st.define(a.ident, a)
        expect(st.lookup(a.ident)).to.equal(a)
    })

    it('should handle scopes', () => {
        st.enterScope('B')
        st.define(b.ident, b)
        expect(st.lookup(b.ident)).to.equal(b)
        st.exitScope()
        expect(st.lookup(b.ident)).to.equal(null)
        expect(st.lookup(a.ident)).to.equal(a)
    })
})
