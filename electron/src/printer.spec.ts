import {expect} from 'chai'
import { IAstImport, IAstDeclStmt, AstDeclType, AstLiteralType,
         IAstAttribute } from './ast'
import {render, IDoc, emitDesign, emitImport, emitModule,
        emitStatement, emitExpression, emitAttribute} from './printer'

function expectPretty(doc: IDoc, text: string) {
    expect(render(80, doc)).to.deep.equal(text);
}

describe('Pretty Printer', () => {
    it('should emit attributes', () => {
        const attributes: IAstAttribute[] = [
            {
                name: { id: 'bom' },
                parameters: [
                    {
                        name: null,
                        value: {
                            value: '"Yago"',
                            litType: AstLiteralType.String,
                        }
                    },
                    {
                        name: null,
                        value: {
                            value: '"XYZ"',
                            litType: AstLiteralType.String,
                        }
                    }
                ]
            }
        ]

        expectPretty(emitAttribute({ name: { id: 'model' }, parameters: [
            { name: null, value: { id: 'A' }}
        ]}), '@model(A)\n')

        expectPretty(emitAttribute({ name: { id: 'parameter' }, parameters: [
            {
                name: { id: 'A_WIDTH' },
                value: {
                    value: '1',
                    litType: AstLiteralType.Integer
                }
            }
        ]}), '@parameter(A_WIDTH=1)\n')

        expectPretty(emitModule({
            attributes,
            exported: false,
            declaration: false,
            identifier: { id: 'mod' },
            parameters: [],
            statements: [],
        }), '@bom("Yago", "XYZ")\nmodule mod {}\n')

        /*expectPretty(emitStatement({
            declType: AstDeclType.Cell,
            width: {
                value: '1',
                litType: AstLiteralType.Integer,
            },
            identifier: {id: 'a'},
        }), '@bom("Yago", "XYZ")\ncell a')*/

        /*expectPretty(emitStatement({
            attributes,
            fqn: [{id: 'a'}, {id: 'b'}, {id: 'c'}],
        }), '@bom("Yago", "XYZ")\na.b.c')*/
    })

    describe('should emit expressions', () => {
        it('should emit references', () => {
            expectPretty(emitExpression({
                identifier: { attributes: [], id: 'a' },
                from: {
                    value: '2',
                    litType: AstLiteralType.Integer,
                },
                to: {
                    value: '2',
                    litType: AstLiteralType.Integer,
                },
            }), 'a[2]')

            expectPretty(emitExpression({
                identifier: { attributes: [], id: 'a' },
                from: {
                    value: '0',
                    litType: AstLiteralType.Integer,
                },
                to: {
                    value: '1',
                    litType: AstLiteralType.Integer,
                },
            }), 'a[0:1]')
        })

        it('should emit concatenations', () => {
            expectPretty(emitExpression({
                expressions: [
                    { id: 'a' },
                    { id: 'b' },
                    { id: 'c' },
                ],
            }), '(a, b, c)')
        })

        it('should emit cells', () => {
            expectPretty(emitExpression({
                module: { id: '$R' },
                width: {
                    value: '2',
                    litType: AstLiteralType.Integer,
                },
                parameters: [
                    {
                        name: null,
                        value: {
                            value: '10k',
                            litType: AstLiteralType.Unit,
                        }
                    }
                ],
                dict: {
                    entries: [
                        {
                            identifier: { id: 'A' },
                            expr: { id: 'a' },
                        }
                    ],
                    star: false,
                }
            }), "$R(10k)[2] {A=a}")

            expectPretty(emitExpression({
                module: { id: '$R' },
                parameters: [
                    {
                        name: null,
                        value: {
                            value: '10k',
                            litType: AstLiteralType.Unit,
                        }
                    }
                ],
                width: {
                    value: '2',
                    litType: AstLiteralType.Integer,
                },
                dict: {
                    entries: [
                        {
                            identifier: { id: 'A' },
                            expr: { id: 'a' },
                        },
                        {
                            identifier: { id: 'B' },
                            expr: { id: 'b' },
                        }
                    ],
                    star: false,
                }
            }), "$R(10k)[2] {A=a, B=b}")
        })
    })

    describe('should emit statements', () => {

        it('should emit declaration', () => {
            expectPretty(emitStatement({
                declType: AstDeclType.Input,
                width: {
                    value: '1',
                    litType: AstLiteralType.Integer,
                },
                identifier: { id: 'a' },
            }), 'input a')

            expectPretty(emitStatement({
                declType: AstDeclType.Inout,
                width: {
                    value: '1',
                    litType: AstLiteralType.Integer,
                },
                identifier: { id: 'a' },
            }), 'inout a')

            expectPretty(emitStatement({
                declType: AstDeclType.Output,
                width: {
                    value: '1',
                    litType: AstLiteralType.Integer,
                },
                identifier: { id: 'a' },
            }), 'output a')

            expectPretty(emitStatement({
                declType: AstDeclType.Net,
                width: {
                    value: '1',
                    litType: AstLiteralType.Integer,
                },
                identifier: { id: 'a' },
            }), 'net a')

            expectPretty(emitStatement({
                declType: AstDeclType.Cell,
                width: {
                    value: '2',
                    litType: AstLiteralType.Integer,
                },
                identifier: { id: 'a' },
            }), 'cell[2] a')
        })

        it('should emit assignments', () => {
            expectPretty(emitStatement({
                lhs: { id: 'a' },
                rhs: { id: 'b' },
            }), 'a = b')

            expectPretty(emitStatement({
                lhs: { id: 'a' },
                rhs: {
                    identifier: {id : 'b' },
                    from: {
                        value: '0',
                        litType: AstLiteralType.Integer,
                    },
                    to: {
                        value: '0',
                        litType: AstLiteralType.Integer,
                    },
                },
            }), 'a = b[0]')
        })

        /*it('should emit fully qualified names', () => {
            expectPretty(emitStatement({
                attributes: [],
                fqn: [{id: 'a'}, {id: 'b'}, {id: 'c'}],
            }), 'a.b.c')
        })*/
    })

    it('should emit imports', () => {
        expectPretty(emitImport({
            identifiers: [{id: 'a'}],
            package: 'package',
        }), 'import a from "package"\n')
    })

    it('should emit modules', () => {
        expectPretty(emitModule({
            attributes: [],
            exported: false,
            declaration: false,
            identifier: {id: 'mod'},
            parameters: [],
            statements: [
                {
                    declType: AstDeclType.Net,
                    width: {
                        value: '1',
                        litType: AstLiteralType.Integer,
                    },
                    identifier: { id: 'a' },
                }
            ],
        }), 'module mod {\n  net a\n}\n')

        expectPretty(emitModule({
            attributes: [],
            exported: true,
            declaration: false,
            identifier: {id: 'mod'},
            parameters: [],
            statements: [],
        }), 'export module mod {}\n')

        expectPretty(emitModule({
            attributes: [],
            exported: true,
            declaration: true,
            identifier: {id: 'mod'},
            parameters: [],
            statements: [],
        }), 'export declare module mod {}\n')
    })

    it('should emit designs', () => {
        expectPretty(emitDesign({
            imports: [
                {
                    identifiers: [{ id: 'a' }],
                    package: 'b',
                }
            ],
            modules: [
                {
                    attributes: [],
                    exported: false,
                    declaration: false,
                    identifier: {id: 'mod'},
                    parameters: [],
                    statements: [],
                }
            ],
        }), 'import a from "b"\nmodule mod {}\n')
    })
})
