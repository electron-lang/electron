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
        expectLabel('const', 'Const')
        expectLabel('clock', 'Clock')
        expectLabel('power', 'Power')
        expectLabel('ground', 'Ground')
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
        expectLabel("1'1", 'Constant')
        expectLabel("4'01xz", 'Constant')
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
