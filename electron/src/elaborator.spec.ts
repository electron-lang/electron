import { expect } from 'chai'
import { elaborate } from './elaborator'
import { AstType, AstLiteralType, AstStatement, AstExpr,
         IAstDesign } from './ast'

function getLoc(text: string, offset: number) {
    return {
        startLine: 1,
        startColumn: offset,
        endLine: 1,
        endColumn: offset + text.length - 1,
    }
}

function expectAst(text: string, ast: IAstDesign) {
    expect(elaborate(text)).to.deep.equal(ast)
}

function expectAstModule(text: string, smts: AstStatement[]) {
    expectAst('module A {' + text + '}', {
        imports: [],
        modules: [
            {
                attributes: [],
                declaration: false,
                exported: false,
                name: {
                    id: 'A',
                    src: getLoc('A', 8),
                },
                statements: smts
            }
        ]
    })
}

function expectAstExpr(text: string, e: AstExpr) {
    expectAstModule('a = ' + text, [
        {
            lhs: { id: 'a', src: getLoc('a', 1 + 10) },
            rhs: e,
        }
    ])
}

describe('Elaborator', () => {
    it('should elaborate to IAstImport', () => {
        expectAst('import a, b from "package"', {
            imports: [
                {
                    'import': {
                        id: 'a',
                        src: getLoc('a', 8)
                    },
                    'from': 'package',
                },
                {
                    'import': {
                        id: 'b',
                        src: getLoc('b', 11)
                    },
                    'from': 'package',
                }
            ],
            modules: [],
        })

        expectAst('import a from "./file"', {
            imports: [
                {
                    'import': {
                        id: 'a',
                        src: getLoc('a', 8)
                    },
                    'from': './file'
                }
            ],
            modules: [],
        })
    })

    it('should elaborate to IAstModule', () => {
        expectAst('module A {}', {
            imports: [],
            modules: [
                {
                    attributes: [],
                    exported: false,
                    declaration: false,
                    name: {
                        id: 'A',
                        src: getLoc('A', 8),
                    },
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
                    name: {
                        id: 'A',
                        src: getLoc('A', 15)
                    },
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
                    name: {
                        id: 'A',
                        src: getLoc('A', 16)
                    },
                    statements: [],
                }
            ],
        })

        expectAst('@bom("Yago", "XYZ") module A {}', {
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
                                        literalType: AstLiteralType.String,
                                        value: 'Yago',
                                    }
                                },
                                {
                                    name: null,
                                    value: {
                                        literalType: AstLiteralType.String,
                                        value: 'XYZ',
                                    }
                                }
                            ]
                        }
                    ],
                    exported: false,
                    declaration: false,
                    name: {
                        id: 'A',
                        src: getLoc('A', 28)
                    },
                    statements: [],
                }
            ],
        })
    })

    it('should elaborate to AstStatement', () => {
        expectAstModule('net a', [
            {
                attributes: [],
                identifier: {
                    id: 'a',
                    src: getLoc('a', 5 + 10)
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
                    src: getLoc('a', 8 + 10)
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
                    src: getLoc('a', 5 + 10)
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
                    src: getLoc('b', 8 + 10)
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
                    src: getLoc('a', 16 + 10)
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
                    src: getLoc('b', 19 + 10)
                },
                'type': {
                    ty: AstType.Net,
                    width: 1,
                    signed: false,
                }
            }
        ])

        const a_decl = {
            attributes: [],
            identifier: {
                id: 'a',
                src: getLoc('a', 5 + 10),
            },
            'type': {
                ty: AstType.Net,
                width: 1,
                signed: false,
            }
        }
        const b_decl = {
            attributes: [],
            identifier: {
                id: 'b',
                src: getLoc('b', 8 + 10),
            },
            'type': {
                ty: AstType.Net,
                width: 1,
                signed: false,
            }
        }

        expectAstModule('net a = c', [
            a_decl,
            {
                lhs: {
                    id: 'a',
                    src: getLoc('a', 5 + 10)
                },
                rhs: {
                    id: 'c',
                    src: getLoc('c', 9 + 10)
                },
            }
        ])

        expectAstModule('net a, b = c, d', [
            a_decl, b_decl,
            {
                lhs: { id: 'a', src: getLoc('a', 5 + 10) },
                rhs: { id: 'c', src: getLoc('c', 12 + 10) },
            },
            {
                lhs: { id: 'b', src: getLoc('b', 8 + 10) },
                rhs: { id: 'd', src: getLoc('d', 15 + 10) },
            }
        ])

        expectAstModule('net a, b = c[0], d[1]', [
            a_decl, b_decl,
            {
                lhs: { id: 'a', src: getLoc('a', 5 + 10) },
                rhs: {
                    identifier: {id: 'c', src: getLoc('c', 12 + 10)},
                    'from': 0,
                    'to': 0,
                },
            },
            {
                lhs: { id: 'b', src: getLoc('b', 8 + 10) },
                rhs: {
                    identifier: {id: 'd', src: getLoc('d', 18 + 10) },
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
                fqn: [
                    { id: 'a', src: getLoc('a', 12 + 10) },
                    { id: 'b', src: getLoc('b', 14 + 10) },
                    { id: 'c', src: getLoc('c', 16 + 10) },
                ]
            }
        ])
    })

    it('should elaborate to IAstExpr', () => {
        expectAstExpr('(a, b, c)', {
            expressions: [
                { id: 'a', src: getLoc('a', 2 + 14) },
                { id: 'b', src: getLoc('b', 5 + 14) },
                { id: 'c', src: getLoc('c', 8 + 14) },
            ],
        })

        expectAstExpr("4'01xz", {
            value: "4'01xz",
            literalType: AstLiteralType.Constant,
        })


        expectAstExpr('a[2:3]', {
            identifier: { id: 'a', src: getLoc('a', 1 + 14) },
            'from': 2,
            'to': 3,
        })

        expectAstExpr('a[2]', {
            identifier: { id: 'a', src: getLoc('a', 1 + 14) },
            'from': 2,
            'to': 2,
        })

        expectAstExpr('$R {}', {
            cellType: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: 1,
            parameters: [],
            assignments: [],
        })

        expectAstExpr('$R()[2] {}', {
            cellType: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: 2,
            parameters: [],
            assignments: [],
        })

        expectAstExpr("$R(10k) {}", {
            cellType: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: 1,
            parameters: [
                {
                    name: null,
                    value: {
                        value: '10k',
                        literalType: AstLiteralType.Unit,
                    }
                }
            ],
            assignments: [],
        })

        expectAstExpr("$R {A}", {
            cellType: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: 1,
            parameters: [],
            assignments: [
                {
                    lhs: { id: 'A', src: getLoc('A', 5 + 14) },
                    rhs: { id: 'A', src: getLoc('A', 5 + 14) },
                }
            ],
        })

        expectAstExpr("$R {A=a}", {
            cellType: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: 1,
            parameters: [],
            assignments: [
                {
                    lhs: { id: 'A', src: getLoc('A', 5 + 14) },
                    rhs: { id: 'a', src: getLoc('a', 7 + 14) },
                }
            ],
        })

        expectAstExpr("$R {A, B=b}", {
            cellType: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: 1,
            parameters: [],
            assignments: [
                {
                    lhs: { id: 'A', src: getLoc('A', 5 + 14) },
                    rhs: { id: 'A', src: getLoc('A', 5 + 14) },
                },
                {
                    lhs: { id: 'B', src: getLoc('B', 8 + 14) },
                    rhs: { id: 'b', src: getLoc('b', 10 + 14) },
                }
            ],
        })
    })
})
