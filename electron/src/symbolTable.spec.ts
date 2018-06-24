import { expect } from 'chai'
import { IAstModule, IAstDeclStmt, Ast, AstDeclType, AstLiteralType } from './ast'
import { DiagnosticCollector, emptySrcLoc } from './diagnostic'
import { SymbolTable } from './symbolTable'

function makeModule(id: string): IAstModule {
    return {
        ast: Ast.Module,
        attributes: [],
        exported: false,
        declaration: false,
        identifier: {
            ast: Ast.Identifier,
            id,
            src: emptySrcLoc
        },
        parameters: [],
        statements: [],
    }
}

function makeOutput(id: string): IAstDeclStmt {
    return {
        ast: Ast.Decl,
        attributes: [],
        declType: AstDeclType.Output,
        width: {
            ast: Ast.Literal,
            value: '1',
            litType: AstLiteralType.Integer,
        },
        identifier: {
            ast: Ast.Identifier,
            id,
            src: emptySrcLoc
        },
    }
}

describe('Symbol Table', () => {
    const dc = new DiagnosticCollector()
    const st = new SymbolTable<IAstModule | IAstDeclStmt>(dc.toPublisher())
    const A = makeModule('A')

    it('should return null when resolving undeclared symbol', () => {
        expect(st.resolveSymbol(A.identifier.id)).to.equal(null)
    })

    it('should return IAstSymbol when resolving a declared symbol', () => {
        st.declareSymbol(A.identifier.id, A)
        expect(st.resolveSymbol(A.identifier.id)).to.equal(A)
    })

    it('should keep track of conflicting symbols', () => {
        st.declareSymbol(A.identifier.id, A)
        expect(st.resolveSymbol(A.identifier.id)).to.equal(A)
    })

    const B = makeModule('B')
    const a = makeOutput('a')

    it('should handle scopes', () => {
        st.declareSymbol(B.identifier.id, B)
        st.enterScope(B.identifier.id)
        st.declareSymbol(a.identifier.id, a)
        expect(st.resolveSymbol(a.identifier.id)).to.equal(a)
        st.exitScope()
        expect(st.resolveSymbol(a.identifier.id)).to.equal(null)
    })
})
