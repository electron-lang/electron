import {lexerInstance, parserInstance as parser} from './parser'

function parseRule(text: string, rule: () => any): any {
    const lexingResult = lexerInstance.tokenize(text)

    if (lexingResult.errors.length > 0) {
        throw new Error(lexingResult.errors[0].message);
    }

    parser.input = lexingResult.tokens

    const cst = rule()

    if (parser.errors.length > 0) {
        throw new Error(parser.errors[0].message)
    }

    return cst
}

function parse(text: string): any {
    return parseRule(text, () => { return parser.design() })
}

describe('Parser', () => {
    it('should parse design', () => {
        parse('import C from "./file"\nmodule A {}\nmodule B {}\n')
    })

    it('should parse import statement', () => {
        const parseImport = (text: string) => {
            parseRule(text, () => { parser.moduleImport() })
        }
        parseImport('import a, b from "package"')
        parseImport('import a from "./file"')
    })

    it('should parse modules', () => {
        const parseModule = (text: string) => {
            parseRule(text, () => { parser.moduleDeclaration() })
        }
        parseModule('module MOD {}')
        parseModule('export module MOD {}')
        parseModule('declare module MOD {}')
        parseModule("@model(A) module MOD {}")
        parseModule('module MOD(R: Ohm, C: Farad) {}')
        parseModule('module A(R: Ohm,) {}')
    })

    it('should parse attributes', () => {
        const parseAttribute = (text: string) => {
            parseRule(text, () => { parser.attribute() })
        }
        parseAttribute('@left')
        parseAttribute('@src("file:8")')
        parseAttribute('@bom("Yago", "XYZ")')
        parseAttribute('@model(A)')
    })

    it('should parse declarations', () => {
        const parseType = (text: string) => {
            parseRule(text, () => { parser.declaration() })
        }
        parseType('net a')
        parseType('net[2] a')
        parseType('output a')
        parseType('input a')
        parseType('inout a')
        parseType('analog a')
        parseType('cell a')
        parseType('const a')
    })

    it('should parse expressions', () => {
        const parseExpression = (text: string) => {
            parseRule(text, () => { parser.expression() })
        }

        // Constant expressions
        /// Literals
        //// Integer
        parseExpression('0')
        parseExpression('10')
        //// Unit
        parseExpression('16MHz')
        parseExpression('10k')
        parseExpression('1uH')
        //// Real
        parseExpression('1.26e-12')
        //// Boolean
        parseExpression('true')
        parseExpression('false')

        /// Binops
        parseExpression('1 + 1')
        parseExpression('1 - 1')
        parseExpression('1 * 1')
        parseExpression('1 << 1')
        parseExpression('1 >> 1')

        // Signal expressions
        /// Digital constant
        parseExpression("1'1")
        parseExpression("4'01xz")
        /// Identifier
        parseExpression('a')
        parseExpression("'+12V")
        /// Reference
        parseExpression('a[2]')
        parseExpression('a[1:2]')
        // Tuples
        parseExpression('(a, b)')
        parseExpression('(a, (b, c))')

        // Cell expressions
        parseExpression('$R {}')
        parseExpression('$R(10k) {}')
        parseExpression('$R(10k,) {}')
        parseExpression("$R(power_rating=125mW) {}")
        parseExpression("$R(10k, power_rating=125mW) {}")
        parseExpression('$R {}')
        parseExpression("$R(10k) {}")
        parseExpression('$R {A}')
        parseExpression('$R {A=a}')
        parseExpression('$R {A=(a, b)}')
        parseExpression('$R {A, A=a, A=(a, b), B=(a, b),}')
        parseExpression('DAC {}')
        parseExpression('cell { @left @set_pad(1) analog TP;' +
                        'output A; @group("A") { inout B; @left input C }}')
    })

    it('should parse statements', () => {
        const parseStatement = (text: string) => {
            parseRule(text, () => { parser.statement() })
        }
        parseStatement('net a')
        parseStatement('a = b')
        parseStatement("a, b[1] = 1'1, 1'1")
        parseStatement("net a, b = 1'1, 1'1")
        parseStatement("output a = 1'1")
        parseStatement('@width(10) net a')
        //parseStatement('@bom("Yago", "XYZ") a.b.c')
        //parseStatement('with a.b { @bom("") c; @bom("") d;}')
        parseStatement('@group { analog A, B }')
    })
})
