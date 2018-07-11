import { expect } from 'chai'
import { ILexingResult } from 'chevrotain'
import { lexerInstance } from './parser'

function tokenize(text: string): ILexingResult {
    const lexResult = lexerInstance.tokenize(text)

    if (lexResult.errors.length > 0) {
        throw new Error(lexResult.errors[0].message);
    }

    return lexResult
}

function getFirstTokenLabel(text: string): string {
    return (tokenize(text).tokens[0].tokenType || {tokenName: ''}).tokenName || ''
}

function expectLabel(text: string, label: string) {
    expect(getFirstTokenLabel(text)).to.equal(label)
}

describe('Lexer', () => {
    it('should lex keywords', () => {
        expectLabel('input', 'Input')
        expectLabel('output', 'Output')
        expectLabel('inout', 'Inout')
        expectLabel('net', 'Net')
        expectLabel('cell', 'Cell')
        expectLabel('module', 'Module')
        expectLabel('import', 'Import')
        expectLabel('from', 'From')
        expectLabel('export', 'Export')
        expectLabel('const', 'Const')
    })

    it('should lex identifiers', () => {
        expectLabel('clk', 'Identifier')
        expectLabel('net1', 'Identifier')
        expectLabel('$and', 'Identifier')
        expectLabel('@src', 'Attribute')
    })

    it('should lex operators', () => {
        expectLabel('=', 'Assign')
        expectLabel('+', 'Plus')
        expectLabel('-', 'Minus')
        expectLabel('*', 'Star')
        expectLabel('<<', 'ShiftLeft')
        expectLabel('>>', 'ShiftRight')
    })

    it('should lex literals', () => {
        expectLabel("1'1", 'BitVector')
        expectLabel("4'01xz", 'BitVector')
        expectLabel('12', 'Integer')
        expectLabel('0', 'Integer')
        expectLabel('10k', 'Unit')
        expectLabel('1nF', 'Unit')
        expectLabel('2.2k', 'Unit')
        expectLabel("'symbol", 'Identifier')
        expectLabel('"a string"', 'String')
        expectLabel('1e-3', 'Real')
        expectLabel('true', 'True')
        expectLabel('false', 'False')
    })

    it('should ignore comments', () => {
        expectLabel('// A single line comment\n0', 'Integer')
    })

    it('should lex doc comments', () => {
        expectLabel('//! A single line design comment\n', 'DesignComment')
        expectLabel('/// A single line module comment\n', 'ModuleComment')
    })

    it('should lex separators', () => {
        expectLabel(',', 'Comma')
        expectLabel(':', 'Colon')
        expectLabel('(', 'OpenRound')
        expectLabel(')', 'CloseRound')
        expectLabel('[', 'OpenSquare')
        expectLabel(']', 'CloseSquare')
        expectLabel('{', 'OpenCurly')
        expectLabel('}', 'CloseCurly')
    })

    it('should lex xml', () => {
        expectLabel('<open-tag>', 'OpenTag')
        expectLabel('</close-tag>', 'CloseTag')
        expectLabel('<auto-closing-tag/>', 'Tag')
    })
})
