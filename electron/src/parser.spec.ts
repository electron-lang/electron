import {parse, parseRule, parserInstance as parser} from './index'

describe('Parser', () => {
    it('should parse design', () => {
        parse('module A {}\nmodule B {}\n')
    })

    it('should parse import statement', () => {
        const parseImport = (text: string) => {
            parseRule(text, () => { parser.importStatement() })
        }
        parseImport('import a, b from "package"')
        parseImport('import a from "./file"')
    })

    it('should parse modules', () => {
        const parseModule = (text: string) => {
            parseRule(text, () => { parser.moduleStatement() })
        }
        parseModule('module MOD {}')
        parseModule('export module MOD {}')
        parseModule('declare module MOD {}')
        parseModule("@model(A) module MOD {}")
    })

    it('should parse attributes', () => {
        const parseAttribute = (text: string) => {
            parseRule(text, () => { parser.attribute() })
        }
        parseAttribute('@src("file:8")')
        parseAttribute('@bom("Yago", "XYZ")')
        parseAttribute('@model(A)')
    })

    it('should parse types', () => {
        const parseType = (text: string) => {
            parseRule(text, () => { parser.typeExpression() })
        }
        parseType('net')
        parseType('net[2]')
        parseType('output')
        parseType('input')
        parseType('inout')
        parseType('analog')
        parseType('cell')
    })

    it('should parse expressions', () => {
        const parseExpression = (text: string) => {
            parseRule(text, () => { parser.expression() })
        }
        // Constant
        parseExpression("4'01xz")
        // Reference
        parseExpression('a')
        parseExpression("'+12V")
        // Index
        parseExpression('a[2]')
        parseExpression('a[1:2]')
        // Concat
        parseExpression('(a, b)')
        parseExpression('(a, (b, c))')
        // Cell
        parseExpression('$R {}')
        parseExpression("$R(10k) {}")
        parseExpression("$R(power_rating=125mW) {}")
        parseExpression("$R(10k, power_rating=125mW) {}")
        parseExpression('$R()[2] {}')
        parseExpression("$R(10k)[2] {}")
        parseExpression('$R {A}')
        parseExpression('$R {A=a}')
        parseExpression('$R {A=(a, b)}')
        parseExpression('$R {A, A=a, A=(a, b), B=(a, b)}')
        parseExpression('DAC {}')
    })

    it('should parse statements', () => {
        const parseStatement = (text: string) => {
            parseRule(text, () => { parser.statement() })
        }
        parseStatement('net a')
        parseStatement('a = b')
        parseStatement("a, b[1] = 1'1, 1'1")
        parseStatement("net a, b = 1'1, 1'1")
        parseStatement('@width(10) net a')
        parseStatement('@bom("Yago", "XYZ") a.b.c')
    })
})
