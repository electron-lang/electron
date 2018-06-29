import { expect } from 'chai'
import * as ast from './ast'
import { TypeChecker } from './typechecker'
import { DiagnosticCollector, DiagnosticTrace } from '../diagnostic';

const dc = new DiagnosticCollector()
const tc = new TypeChecker(dc.toPublisher('typechecker.spec.ts', []))

function expectFail() {
    const diags = dc.getDiagnostics()
    dc.reset()
    expect(diags.length > 0).to.true
}

function expectOk() {
    const diags = dc.getDiagnostics()
    dc.reset()
    if (diags.length > 0) {
        throw new Error(diags[0].message)
    }
}
/*
describe('Type Checker', () => {
    describe('Integer expressions', () => {
        it('should ok when integer literal', () => {
            tc.checkIsInteger(ast.Integer(1))
            expectOk()
        })

        it('should ok when ref to integer parameter', () => {
            tc.reset()
            const mod = ast.Module('Test', [
                ast.ParamDecl(ast.Ident('WIDTH'), ast.Ident('Integer'))
            ])
            tc.defineModuleElements(mod)
            tc.checkIsInteger(ast.Ident('WIDTH'))
            expectOk()
        })

        it('should ok when ref to const', () => {
            tc.reset()
            const mod = ast.Module('Test', [
                ast.Const(ast.Ident('CONSTANT'))
            ])
            tc.defineModuleElements(mod)
            tc.checkIsInteger(ast.Ident('CONSTANT'))
            expectOk()
        })

        it('should fail when ref to cell', () => {
            tc.reset()
            const mod = ast.Module('Test', [
                ast.Cell(ast.Ident('r1'))
            ])
            tc.defineModuleElements(mod)
            tc.checkIsInteger(ast.Ident('r1'))
            expectFail()
        })

        it('should ok when binop of integer', () => {
            tc.checkIsInteger(ast.BinOp('+', ast.Integer(1), ast.Integer(2)))
            expectOk()
        })

        it('should fail when binop of non-integer', () => {
            tc.checkIsInteger(ast.BinOp('+', ast.Integer(1), ast.String('hello')))
            expectFail()
        })

    })

    describe('Module Instances', () => {
        const $R = ast.Module('$R', [
            ast.ParamDecl(ast.Ident('RESISTANCE'), ast.Ident('Ohm')),
            ast.Port(ast.Ident('A'), 'analog'),
            ast.Port(ast.Ident('B'), 'analog')
        ])

        const netA = ast.Module('Test', [
            ast.Net(ast.Ident('a'))
        ])

        const paramRES = ast.Module('Test', [
            ast.ParamDecl(ast.Ident('RES'), ast.Ident('Ohm'))
        ])

        const paramCAP = ast.Module('Test', [
            ast.ParamDecl(ast.Ident('CAP'), ast.Ident('Farad'))
        ])

        describe('Parameters', () => {
            it('should ok positional param', () => {
                tc.reset()
                tc.defineModule($R)
                const inst = ast.ModInst($R, [
                    ast.Param(0, ast.Unit(10, 3, ''))
                ], ast.Dict([]))
                tc.checkModInst(inst)
                expectOk()
            })

            it('should ok named param', () => {
                tc.reset()
                tc.defineModule($R)
                tc.defineModuleElements(netA)
                const inst = ast.ModInst($R, [
                    ast.Param(ast.Ident('RESISTANCE'),
                              ast.Unit(10, 3, 'Ohm'))
                ], ast.Dict([
                    ast.DictEntry(ast.Ident('A'), ast.Ident('a'))
                ]))
                tc.checkModInst(inst)
                expectOk()
            })

            it('should fail type mismatch', () => {
                tc.reset()
                tc.defineModule($R)
                const inst = ast.ModInst($R, [
                    ast.Param(ast.Ident('RESISTANCE'),
                              ast.Real(10e3))
                ], ast.Dict([]))
                tc.checkModInst(inst)
                expectFail()
            })

            it('should fail unit mismatch', () => {
                tc.reset()
                tc.defineModule($R)
                const inst = ast.ModInst($R, [
                    ast.Param(ast.Ident('RESISTANCE'),
                              ast.Unit(10, 3, 'F'))
                ], ast.Dict([]))
                tc.checkModInst(inst)
                expectFail()
            })

            it('should ok param passthrough', () => {
                tc.reset()
                tc.defineModule($R)
                tc.defineModuleElements(paramRES)
                const inst = ast.ModInst($R, [
                    ast.Param(ast.Ident('RESISTANCE'),
                              ast.Ident('RES'))
                ], ast.Dict([]))
                tc.checkModInst(inst)
                expectOk()
            })

            it('should fail param passthrough of wrong type', () => {
                tc.reset()
                tc.defineModule($R)
                tc.defineModuleElements(paramCAP)
                const inst = ast.ModInst($R, [
                    ast.Param(ast.Ident('RESISTANCE'),
                              ast.Ident('CAP'))
                ], ast.Dict([]))
                tc.checkModInst(inst)
                expectFail()
            })
        })

        describe('Connections', () => {
            it('should ok when port', () => {
                tc.reset()
                tc.defineModule($R)
                tc.defineModuleElements(netA)
                const inst = ast.ModInst($R, [], ast.Dict([
                    ast.DictEntry(ast.Ident('A'), ast.Ident('a'))
                ]))
                tc.checkModInst(inst)
                expectOk()
            })

            it('should fail when no port', () => {
                tc.reset()
                tc.defineModule($R)
                tc.defineModuleElements(netA)
                const inst = ast.ModInst($R, [], ast.Dict([
                    ast.DictEntry(ast.Ident('D'), ast.Ident('a'))
                ]))
                tc.checkModInst(inst)
                expectFail()
            })

            it('should fail when no net', () => {
                tc.reset()
                tc.defineModule($R)
                tc.defineModuleElements(netA)
                const inst = ast.ModInst($R, [], ast.Dict([
                    ast.DictEntry(ast.Ident('A'), ast.Ident('d'))
                ]))
                tc.checkModInst(inst)
                expectFail()
            })
        })
    })
})
*/
