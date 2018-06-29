import { expect } from 'chai'
import * as ast from './ast'
import { printAST } from './printer'

function expectPretty(a: ast.Ast, text: string) {
    expect(printAST(a)).to.deep.equal(text);
}

describe('Pretty Printer', () => {
    it('should emit attributes', () => {
        const bomAttr = ast.Attr('bom', [
            ast.String('Yago'),
            ast.String('XYZ'),
        ])

        expectPretty(ast.Attr('model', [
            ast.Ref(ast.Module('A', []))
        ]), '@model(A)')

        expectPretty(ast.Attr('parameter', [
            ast.String('A_WIDTH'),
            ast.Integer(1)
        ]), '@parameter("A_WIDTH", 1)')

        const mod = ast.Module('MOD', [])
        mod.attrs.push(bomAttr)
        expectPretty(mod, '@bom("Yago", "XYZ")\nmodule MOD {}\n')
        mod.attrs.pop()

        mod.params.push(ast.Param('R', 'Ohm'))
        expectPretty(mod, 'module MOD(R: Ohm) {}\n')
        mod.params.pop()

        const cell = ast.Cell('a')
        cell.attrs.push(bomAttr)
        expectPretty(cell, '@bom("Yago", "XYZ")\ncell a')
    })

    describe('should emit expressions', () => {
        const a = ast.Net('a')
        const b = ast.Net('b')
        const c = ast.Net('c')

        it('should emit indexes', () => {
            const a = ast.Net('a')
            const i = ast.Integer(2)
            expectPretty(ast.Range(ast.Ref(a), i), 'a[2]')

            expectPretty(ast.Range(ast.Ref(a),
                                   ast.Integer(0),
                                   ast.Integer(1)), 'a[0:1]')
        })

        it('should emit concatenations', () => {
            expectPretty(ast.Tuple([
                ast.Ref(a), ast.Ref(b), ast.Ref(c)
            ]), '(a, b, c)')
        })

        it('should emit insts', () => {
            const A = ast.Port('A', 'analog')
            const B = ast.Port('B', 'analog')
            const RESISTANCE = ast.Param('RESISTANCE', 'Ohm')
            const $R = ast.Module('$R', [RESISTANCE, A, B])

            const inst = ast.Inst(ast.Ref($R), [
                [ast.Ref(RESISTANCE), ast.Unit('10k')]
            ], [
                [ast.Ref(A), ast.Ref(a)]
            ])
            expectPretty(inst, '$R(RESISTANCE=10k) {A=a}')

            inst.conns.push([ast.Ref(B), ast.Ref(b)])
            expectPretty(inst, '$R(RESISTANCE=10k) {A=a, B=b}')
        })
    })

    describe('should emit statements', () => {
        const a = ast.Net('a')
        const b = ast.Net('b')

        it('should emit declaration', () => {
            expectPretty(ast.Port('a', 'input'), 'input a')

            expectPretty(ast.Port('a', 'output'), 'output a')

            expectPretty(ast.Port('a', 'inout'), 'inout a')

            expectPretty(ast.Port('a', 'analog'), 'analog a')

            expectPretty(ast.Net('a'), 'net a')

            expectPretty(ast.Cell('a', ast.Integer(2)), 'cell[2] a')
        })

        it('should emit assignments', () => {
            expectPretty(ast.Assign(ast.Ref(a), ast.Ref(b)), 'a = b')

            expectPretty(ast.Assign(ast.Ref(a), ast.Range(ast.Ref(b),
                                                          ast.Integer(0))),
                         'a = b[0]')
        })
    })

    it('should emit modules', () => {
        expectPretty(ast.Module('MOD', [ ast.Net('a') ]),
                     'module MOD {\n  net a\n}\n')

        const MOD = ast.Module('MOD', [])
        MOD.exported = true
        expectPretty(MOD, 'export module MOD {}\n')

        MOD.declaration = true
        expectPretty(MOD, 'export declare module MOD {}\n')
    })
})
