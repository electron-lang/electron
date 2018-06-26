import { expect } from 'chai'
import * as ast from './ast'
import { printAST } from './printer'

function expectPretty(a: ast.Ast, text: string) {
    expect(printAST(a)).to.deep.equal(text);
}

describe('Pretty Printer', () => {
    it('should emit attributes', () => {
        const bomAttr = ast.Attr(ast.Ident('bom'), [
            ast.Param(0, ast.String('Yago')),
            ast.Param(1, ast.String('XYZ'))
        ])

        expectPretty(ast.Attr(ast.Ident('model'), [
            ast.Param(0, ast.Ident('A'))
        ]), '@model(A)')

        expectPretty(ast.Attr(ast.Ident('parameter'), [
            ast.Param(ast.Ident('A_WIDTH'), ast.Integer(1))
        ]), '@parameter(A_WIDTH=1)')

        const mod = ast.Module('mod')

        mod.attrs.push(bomAttr)
        expectPretty(mod, '@bom("Yago", "XYZ")\nmodule mod {}\n')
        mod.attrs.pop()

        mod.params.push(ast.ParamDecl(ast.Ident('R'), ast.Ident('Ohm')))
        expectPretty(mod, 'module mod(R: Ohm) {}\n')
        mod.params.pop()

        const cell = ast.Cell(ast.Ident('a'))
        cell.attrs.push(bomAttr)
        expectPretty(cell, '@bom("Yago", "XYZ")\ncell a')

        /*const setattr = ast.SetAttr([bomAttr])
        setattr.fqns.push(ast.FQN([ast.Ident('a'), ast.Ident('b'), ast.Ident('c')]))
        expectPretty(setattr, '@bom("Yago", "XYZ")\na.b.c')*/
    })

    describe('should emit expressions', () => {
        it('should emit references', () => {
            expectPretty(ast.Ref(ast.Ident('a'), ast.Integer(2),
                                 ast.Integer(2)), 'a[2]')

            expectPretty(ast.Ref(ast.Ident('a'), ast.Integer(0),
                                 ast.Integer(1)), 'a[0:1]')
        })

        it('should emit concatenations', () => {
            expectPretty(ast.Tuple([
                ast.Ident('a'), ast.Ident('b'), ast.Ident('c')
            ]), '(a, b, c)')
        })

        it('should emit mod insts', () => {
            const dict = ast.Dict()
            dict.entries.push(ast.DictEntry(ast.Ident('A'), ast.Ident('a')))
            const inst = ast.ModInst(ast.Module('$R'), [
                ast.Param(0, ast.Unit(10, 3, ''))
            ], dict)

            expectPretty(inst, '$R(10K) {A=a}')

            dict.entries.push(ast.DictEntry(ast.Ident('B'), ast.Ident('b')))
            expectPretty(inst, '$R(10K) {A=a, B=b}')
        })
    })

    describe('should emit statements', () => {

        it('should emit declaration', () => {
            expectPretty(ast.Port(ast.Ident('a'), 'input'), 'input a')

            expectPretty(ast.Port(ast.Ident('a'), 'output'), 'output a')

            expectPretty(ast.Port(ast.Ident('a'), 'inout'), 'inout a')

            expectPretty(ast.Port(ast.Ident('a'), 'analog'), 'analog a')

            expectPretty(ast.Net(ast.Ident('a')), 'net a')

            expectPretty(ast.Cell(ast.Ident('a'), ast.Integer(2)), 'cell[2] a')
        })

        it('should emit assignments', () => {
            expectPretty(ast.Assign(ast.Ident('a'), ast.Ident('b')), 'a = b')

            expectPretty(ast.Assign(ast.Ident('a'),
                                    ast.Ref(ast.Ident('b'), ast.Integer(0))),
                         'a = b[0]')
        })

        /*it('should emit fully qualified names', () => {
            expectPretty(ast.FQN([ast.Ident('a'), ast.Ident('b'), ast.Ident('c')]),
                         'a.b.c')
        })*/
    })

    it('should emit imports', () => {
        expectPretty(ast.Import([ast.Ident('a')], 'package'),
                     'import a from "package"\n')
    })

    it('should emit modules', () => {
        const mod = ast.Module('mod')

        mod.nets.push(ast.Net(ast.Ident('a')))
        expectPretty(mod, 'module mod {\n  net a\n}\n')
        mod.nets.pop()

        mod.exported = true
        expectPretty(mod, 'export module mod {}\n')

        mod.declaration = true
        expectPretty(mod, 'export declare module mod {}\n')
    })

    it('should emit designs', () => {
        const design = ast.Design()
        design.imports.push(ast.Import([ast.Ident('a')], 'b'))
        design.modules.push(ast.Module('mod'))
        expectPretty(design, 'import a from "b"\nmodule mod {}\n')
    })
})
