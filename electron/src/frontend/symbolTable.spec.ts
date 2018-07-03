import { expect } from 'chai'
import * as ast from './ast'
import { DiagnosticCollector } from '../diagnostic'
import { Symbol, SymbolTable } from './symbolTable'

describe('Symbol Table', () => {
    const dc = new DiagnosticCollector()
    const st = new SymbolTable<ast.IPort>(
        dc.toPublisher('symbolTable.spec.ts', []))

    const a = ast.Port('a', 'output')
    const b = ast.Port('b', 'output')
    const x = ast.Port('x', 'output')

    st.enterScope('A')

    it('should return null when resolving undeclared symbol', () => {
        expect(st.lookup(Symbol('a'))).to.equal(null)
    })

    it('should return a symbol when resolving a declared symbol', () => {
        st.define(Symbol('a'), a)
        expect(st.lookup(Symbol('a'))).to.equal(a)
    })

    it('should keep track of conflicting symbols', () => {
        st.define(Symbol('a'), a)
        expect(st.lookup(Symbol('a'))).to.equal(a)
    })

    it('should handle scopes', () => {
        st.enterScope('B')
        st.define(Symbol('b'), b)
        expect(st.lookup(Symbol('b'))).to.equal(b)
        st.exitScope()
        expect(st.lookup(Symbol('b'))).to.equal(null)
        expect(st.lookup(Symbol('a'))).to.equal(a)
    })

    it('should handle anonymous scopes', () => {
        expect(st.lookup(Symbol('x'))).to.equal(null)
        st.enterScope()
        st.define(Symbol('x'), x)
        expect(st.lookup(Symbol('x'))).to.equal(x)
        st.exitScope()
        expect(st.lookup(Symbol('x'))).to.equal(null)
    })

    it('should never fail when exiting a scope', () => {
        st.exitScope()
        st.exitScope()
    })

    it('should keep named scopes', () => {
        st.enterScope('B')
        expect(st.lookup(Symbol('b'))).to.equal(b)
    })
})
