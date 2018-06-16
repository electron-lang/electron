import {expect} from 'chai'
import {tokenize} from './index'

function getFirstTokenLabel(text: string): string {
    return (tokenize(text).tokens[0].tokenType || {}).tokenName || '';
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
    })

    it('should lex identifiers', () => {
        expectLabel('clk', 'Identifier')
        expectLabel('net1', 'Identifier')
        expectLabel('$and', 'CellType')
        expectLabel('@src', 'Attribute')
    })

    it('should lex operators', () => {
        expectLabel('=', 'Assign')
    })

    it('should lex literals', () => {
        expectLabel("4'01xz", 'Constant')
        expectLabel('12', 'Integer')
        expectLabel('0', 'Integer')
        expectLabel("'symbol", 'Symbol')
        expectLabel('"a string"', 'String')
    })

    it('should ignore comments', () => {
        expectLabel('// A single line comment\n0', 'Integer')
        expectLabel('/// A single line doc comment\n0', 'Integer')
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
})
