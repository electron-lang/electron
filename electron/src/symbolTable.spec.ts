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
    const st = new SymbolTable(dc.toPublisher())
    const A = makeModule('A')

    it('should return null when resolving undeclared symbol', () => {
        expect(st.resolveModule(A.identifier)).to.equal(null)
    })

    it('should return IAstSymbol when resolving a declared symbol', () => {
        st.declareModule(A)
        expect(st.resolveModule(A.identifier)).to.equal(A)
    })

    it('should keep track of conflicting symbols', () => {
        st.declareModule(A)
        expect(st.resolveModule(A.identifier)).to.equal(A)
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
        expect(st.resolveDeclaration(a.identifier)).to.equal(a)
        st.exitScope()
        expect(st.resolveDeclaration(a.identifier)).to.equal(null)
    })
})
