import { expect } from 'chai'
import { DiagnosticCollector, Logger } from '../diagnostic'
import { TypeChecker } from './typechecker'
import * as ast from './ast'

const dc = new DiagnosticCollector()
const tc = new TypeChecker({
    logger: new Logger(dc),
    manglingPrefix: '',
    file: 'typechecker.spec.ts'
})

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

describe('Type Checker', () => {
    describe('Integer expressions', () => {
        it('should ok when integer literal', () => {
            tc.checkIsInteger(ast.Integer(1))
            expectOk()
        })

        it('should ok when ref to integer parameter', () => {
            tc.checkIsInteger(ast.Ref(ast.Param('WIDTH', 'Integer')))
            expectOk()
        })

        it('should ok when ref to const', () => {
            tc.checkIsInteger(ast.Ref(ast.Const('C')))
            expectOk()
        })

        it('should fail when ref to cell', () => {
            tc.checkIsInteger(ast.Ref(ast.Cell('r1')))
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

    describe('Parameters', () => {
        it('should fail type mismatch', () => {
            tc.checkParam(ast.Param('RES', 'Ohm'), ast.Real(10e3))
            expectFail()
        })

        it('should fail unit mismatch', () => {
            tc.checkParam(ast.Param('RES', 'Ohm'), ast.Unit('10nF'))
            expectFail()
        })

        it('should ok unit match', () => {
            tc.checkParam(ast.Param('RES', 'Ohm'), ast.Unit('10k'))
            expectOk()
        })

        it('should ok param passthrough', () => {
            tc.checkParam(ast.Param('RES', 'Ohm'), ast.Ref(ast.Param('R', 'Ohm')))
            expectOk()
        })

        it('should fail param passthrough of wrong type', () => {
            tc.checkParam(ast.Param('RES', 'Ohm'), ast.Ref(ast.Param('C', 'Farad')))
        })
    })
})
