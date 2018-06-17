import { expect } from 'chai'
import { toAst } from './index'
import { AstType, AstLiteralType, AstStatement, AstExpr,
         IAstDesign } from './ast'

function expectAst(text: string, ast: IAstDesign) {
    expect(toAst(text)).to.deep.equal(ast)
}

function expectAstModule(text: string, smts: AstStatement[]) {
    expectAst('module A {' + text + '}', {
        imports: [],
        modules: [
            {
                attributes: [],
                declaration: false,
                exported: false,
                name: 'A',
                statements: smts
            }
        ]
    })
}

function expectAstExpr(text: string, e: AstExpr) {
    expectAstModule('a = ' + text, [
        {
            lhs: { id: 'a' },
            rhs: e,
        }
    ])
}

describe('To AST', () => {
    it('should parse to IAstImport', () => {
        expectAst('import a, b from "package"', {
            imports: [
                {
                    'import': 'a',
                    'from': 'package',
                },
                {
                    'import': 'b',
                    'from': 'package',
                }
            ],
            modules: [],
        })

        expectAst('import a from "./file"', {
            imports: [
                {
                    'import': 'a',
                    'from': './file'
                }
            ],
            modules: [],
        })
    })

    it('should parse to IAstModule', () => {
        expectAst('module A {}', {
            imports: [],
            modules: [
                {
                    attributes: [],
                    exported: false,
                    declaration: false,
                    name: 'A',
                    statements: [],
                }
            ],
        })

        expectAst('export module A {}', {
            imports: [],
            modules: [
                {
                    attributes: [],
                    exported: true,
                    declaration: false,
                    name: 'A',
                    statements: [],
                }
            ],
        })

        expectAst('declare module A {}', {
            imports: [],
            modules: [
                {
                    attributes: [],
                    exported: false,
                    declaration: true,
                    name: 'A',
                    statements: [],
                }
            ],
        })

        expectAst("@bom('Yago, 'XYZ) module A {}", {
            imports: [],
            modules: [
                {
                    attributes: [
                        {
                            name: 'bom',
                            parameters: [
                                {
                                    name: null,
                                    value: {
                                        literalType: AstLiteralType.Symbol,
                                        value: 'Yago',
                                    }
                                },
                                {
                                    name: null,
                                    value: {
                                        literalType: AstLiteralType.Symbol,
                                        value: 'XYZ',
                                    }
                                }
                            ]
                        }
                    ],
                    exported: false,
                    declaration: false,
                    name: 'A',
                    statements: [],
                }
            ],
        })
    })

    it('should parse to AstStatement', () => {
        expectAstModule('net a', [
            {
                attributes: [],
                identifier: {
                    id: 'a',
                },
                'type': {
                    ty: AstType.Net,
                    width: 1,
                    signed: false,
                }
            }
        ])

        expectAstModule('net[2] a', [
            {
                attributes: [],
                identifier: {
                    id: 'a',
                },
                'type': {
                    ty: AstType.Net,
                    width: 2,
                    signed: false,
                }
            }
        ])

        expectAstModule('net a, b', [
            {
                attributes: [],
                identifier: {
                    id: 'a',
                },
                'type': {
                    ty: AstType.Net,
                    width: 1,
                    signed: false,
                }
            },
            {
                attributes: [],
                identifier: {
                    id: 'b',
                },
                'type': {
                    ty: AstType.Net,
                    width: 1,
                    signed: false,
                }
            }
        ])

        expectAstModule('@width(10) net a, b', [
            {
                attributes: [
                    {
                        name: 'width',
                        parameters: [
                            {
                                name: null,
                                value: {
                                    literalType: AstLiteralType.Integer,
                                    value: 10,
                                }
                            }
                        ],
                    }
                ],
                identifier: {
                    id: 'a',
                },
                'type': {
                    ty: AstType.Net,
                    width: 1,
                    signed: false,
                }
            },
            {
                attributes: [
                    {
                        name: 'width',
                        parameters: [
                            {
                                name: null,
                                value: {
                                    literalType: AstLiteralType.Integer,
                                    value: 10,
                                }
                            }
                        ],
                    }
                ],
                identifier: {
                    id: 'b',
                },
                'type': {
                    ty: AstType.Net,
                    width: 1,
                    signed: false,
                }
            }
        ])

        const a = {
            attributes: [],
            identifier: {
                id: 'a',
            },
            'type': {
                ty: AstType.Net,
                width: 1,
                signed: false,
            }
        }
        const b = {
            attributes: [],
            identifier: {
                id: 'b',
            },
            'type': {
                ty: AstType.Net,
                width: 1,
                signed: false,
            }
        }

        expectAstModule('net a = c', [
            a,
            {
                lhs: { id: 'a' },
                rhs: { id: 'c' },
            }
        ])

        expectAstModule('net a, b = c, d', [
            a, b,
            {
                lhs: { id: 'a' },
                rhs: { id: 'c' },
            },
            {
                lhs: { id: 'b' },
                rhs: { id: 'd' },
            }
        ])

        expectAstModule('net a, b = c[0], d[1]', [
            a, b,
            {
                lhs: { id: 'a' },
                rhs: {
                    identifier: {id : 'c' },
                    'from': 0,
                    'to': 0,
                },
            },
            {
                lhs: { id: 'b' },
                rhs: {
                    identifier: {id : 'd' },
                    'from': 1,
                    'to': 1,
                },
            }
        ])

        expectAstModule("@width(10) a.b.c", [
            {
                attributes: [
                    {
                        name: 'width',
                        parameters: [
                            {
                                name: null,
                                value: {
                                    value: 10,
                                    literalType: AstLiteralType.Integer
                                },
                            }
                        ]
                    }
                ],
                fqn: ['a', 'b', 'c']
            }
        ])
    })

    it('should parse to IAstExpr', () => {
        expectAstExpr('(a, b, c)', {
            expressions: [
                { id: 'a' },
                { id: 'b' },
                { id: 'c' },
            ],
        })

        expectAstExpr("4'01xz", {
            value: "4'01xz",
            literalType: AstLiteralType.Constant,
        })


        expectAstExpr('a[2:3]', {
            identifier: {
                id: 'a',
            },
            'from': 2,
            'to': 3,
        })

        expectAstExpr('a[2]', {
            identifier: {
                id: 'a',
            },
            'from': 2,
            'to': 2,
        })

        expectAstExpr('$R {}', {
            cellType: '$R',
            width: 1,
            parameters: [],
            assignments: [],
        })

        expectAstExpr('$R()[2] {}', {
            cellType: '$R',
            width: 2,
            parameters: [],
            assignments: [],
        })

        expectAstExpr("$R('10k) {}", {
            cellType: '$R',
            width: 1,
            parameters: [
                {
                    name: null,
                    value: {
                        value: '10k',
                        literalType: AstLiteralType.Symbol,
                    }
                }
            ],
            assignments: [],
        })

        expectAstExpr("$R {A}", {
            cellType: '$R',
            width: 1,
            parameters: [],
            assignments: [
                {
                    lhs: { id: 'A' },
                    rhs: { id: 'A' },
                }
            ],
        })

        expectAstExpr("$R {A=a}", {
            cellType: '$R',
            width: 1,
            parameters: [],
            assignments: [
                {
                    lhs: { id: 'A' },
                    rhs: { id: 'a' },
                }
            ],
        })

        expectAstExpr("$R {A, B=b}", {
            cellType: '$R',
            width: 1,
            parameters: [],
            assignments: [
                {
                    lhs: { id: 'A' },
                    rhs: { id: 'A' },
                },
                {
                    lhs: { id: 'B' },
                    rhs: { id: 'b' },
                }
            ],
        })
    })
})
