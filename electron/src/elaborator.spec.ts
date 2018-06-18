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
                    'from': {
                        value: 'package',
                        literalType: AstLiteralType.String,
                        src: getLoc('"package"', 18),
                    }
                },
                {
                    'import': {
                        id: 'b',
                        src: getLoc('b', 11)
                    },
                    'from': {
                        value: 'package',
                        literalType: AstLiteralType.String,
                        src: getLoc('"package"', 18),
                    }
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
                    'from': {
                        value: './file',
                        literalType: AstLiteralType.String,
                        src: getLoc('"./file"', 15),
                    }
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
                            name: { id: 'bom', src: getLoc('@bom', 1) },
                            parameters: [
                                {
                                    name: null,
                                    value: {
                                        literalType: AstLiteralType.String,
                                        value: 'Yago',
                                        src: getLoc('"Yago"', 6),
                                    }
                                },
                                {
                                    name: null,
                                    value: {
                                        literalType: AstLiteralType.String,
                                        value: 'XYZ',
                                        src: getLoc('"XYZ"', 14),
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
                        name: {id: 'width', src: getLoc('@width', 1 + 10) },
                        parameters: [
                            {
                                name: null,
                                value: {
                                    literalType: AstLiteralType.Integer,
                                    value: 10,
                                    src: getLoc('10', 8 + 10),
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
                        name: {id: 'width', src: getLoc('@width', 1 + 10) },
                        parameters: [
                            {
                                name: null,
                                value: {
                                    literalType: AstLiteralType.Integer,
                                    value: 10,
                                    src: getLoc('10', 8 + 10),
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
                    src: getLoc('c[0]', 12 + 10),
                },
            },
            {
                lhs: { id: 'b', src: getLoc('b', 8 + 10) },
                rhs: {
                    identifier: {id: 'd', src: getLoc('d', 18 + 10) },
                    'from': 1,
                    'to': 1,
                    src: getLoc('d[1]', 18 + 10),
                },
            }
        ])

        expectAstModule("@width(10) a.b.c", [
            {
                attributes: [
                    {
                        name: {id: 'width', src: getLoc('@width', 1 + 10) },
                        parameters: [
                            {
                                name: null,
                                value: {
                                    value: 10,
                                    literalType: AstLiteralType.Integer,
                                    src: getLoc('10', 8 + 10),
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
            src: getLoc('(a, b, c)', 1 + 14),
        })

        expectAstExpr("4'01xz", {
            value: "4'01xz",
            literalType: AstLiteralType.Constant,
            src: getLoc("4'01xz", 1 + 14),
        })


        expectAstExpr('a[2:3]', {
            identifier: { id: 'a', src: getLoc('a', 1 + 14) },
            'from': 2,
            'to': 3,
            src: getLoc('a[2:3]', 1 + 14),
        })

        expectAstExpr('a[2]', {
            identifier: { id: 'a', src: getLoc('a', 1 + 14) },
            'from': 2,
            'to': 2,
            src: getLoc('a[2]', 1 + 14),
        })

        expectAstExpr('$R {}', {
            cellType: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: 1,
            parameters: [],
            assignments: [],
            src: getLoc('$R {}', 1 + 14),
        })

        expectAstExpr('$R()[2] {}', {
            cellType: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: 2,
            parameters: [],
            assignments: [],
            src: getLoc('$R()[2] {}', 1 + 14),
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
                        src: getLoc('10k', 4 + 14),
                    }
                }
            ],
            assignments: [],
            src: getLoc('$R(10k) {}', 1 + 14),
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
            src: getLoc('$R {A}', 1 + 14),
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
            src: getLoc('$R {A=a}', 1 + 14),
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
            src: getLoc('$R {A, B=b}', 1 + 14),
        })
    })
})
