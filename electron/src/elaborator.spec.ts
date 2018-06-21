import { expect } from 'chai'
import { elaborate } from './elaborator'
import { AstLiteralType, AstDeclType, AstStmt, AstExpr, IAstDesign, IAstDeclStmt } from './ast'

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

function expectAstModule(text: string, smts: AstStmt[]) {
    expectAst('module A {' + text + '}', {
        imports: [],
        modules: [
            {
                attributes: [],
                exported: false,
                declaration: false,
                identifier: {
                    id: 'A',
                    src: getLoc('A', 8),
                },
                parameters: [],
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
                    identifiers: [
                        {
                            id: 'a',
                            src: getLoc('a', 8)
                        },
                        {
                            id: 'b',
                            src: getLoc('b', 11)
                        }
                    ],
                    package: 'package',
                    src: getLoc('"package"', 18),
                },
            ],
            modules: [],
        })

        expectAst('import a from "./file"', {
            imports: [
                {
                    identifiers: [
                        {
                            id: 'a',
                            src: getLoc('a', 8)
                        }
                    ],
                    package: './file',
                    src: getLoc('"./file"', 15),
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
                    identifier: {
                        id: 'A',
                        src: getLoc('A', 8),
                    },
                    parameters: [],
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
                    identifier: {
                        id: 'A',
                        src: getLoc('A', 15)
                    },
                    parameters: [],
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
                    identifier: {
                        id: 'A',
                        src: getLoc('A', 16)
                    },
                    parameters: [],
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
                                        litType: AstLiteralType.String,
                                        value: '"Yago"',
                                        src: getLoc('"Yago"', 6),
                                    }
                                },
                                {
                                    name: null,
                                    value: {
                                        litType: AstLiteralType.String,
                                        value: '"XYZ"',
                                        src: getLoc('"XYZ"', 14),
                                    }
                                }
                            ]
                        }
                    ],
                    exported: false,
                    declaration: false,
                    identifier: {
                        id: 'A',
                        src: getLoc('A', 28)
                    },
                    parameters: [],
                    statements: [],
                }
            ],
        })
    })

    it('should elaborate to AstStatement', () => {
        expectAstModule('net a', [
            {
                identifier: {
                    id: 'a',
                    src: getLoc('a', 5 + 10)
                },
                declType: AstDeclType.Net,
                width: {
                    litType: AstLiteralType.Integer,
                    value: '1',
                },
            }
        ])

        expectAstModule('net[2] a', [
            {
                identifier: {
                    id: 'a',
                    src: getLoc('a', 8 + 10)
                },
                declType: AstDeclType.Net,
                width: {
                    litType: AstLiteralType.Integer,
                    value: '2',
                    src: getLoc('2', 5 + 10),
                },
            }
        ])

        expectAstModule('net a, b', [
            {
                identifier: {
                    id: 'a',
                    src: getLoc('a', 5 + 10)
                },
                declType: AstDeclType.Net,
                width: {
                    litType: AstLiteralType.Integer,
                    value: '1',
                },
            },
            {
                identifier: {
                    id: 'b',
                    src: getLoc('b', 8 + 10)
                },
                declType: AstDeclType.Net,
                width: {
                    litType: AstLiteralType.Integer,
                    value: '1',
                },
            }
        ])

        /*expectAstModule('@width(10) net a, b', [
            {
                attributes: [
                    {
                        name: {id: 'width', src: getLoc('@width', 1 + 10) },
                        parameters: [
                            {
                                name: null,
                                value: {
                                    litType: AstLiteralType.Integer,
                                    value: '10',
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
                declType: AstDeclType.Net,
                width: {
                    litType: AstLiteralType.Integer,
                    value: '1',
                },
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
                declType: AstDeclType.Net,
                width: {
                    litType: AstLiteralType.Integer,
                    value: '1',
                },
            }
        ])*/

        const a_decl = {
            identifier: {
                id: 'a',
                src: getLoc('a', 5 + 10),
            },
            declType: AstDeclType.Net,
            width: {
                litType: AstLiteralType.Integer,
                value: '1',
            },
        }
        const b_decl = {
            identifier: {
                id: 'b',
                src: getLoc('b', 8 + 10),
            },
            declType: AstDeclType.Net,
            width: {
                litType: AstLiteralType.Integer,
                value: '1',
            },
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
                    'from': {
                        litType: AstLiteralType.Integer,
                        value: '0',
                        src: getLoc('0', 14 + 10),
                    },
                    'to': {
                        litType: AstLiteralType.Integer,
                        value: '0',
                        src: getLoc('0', 14 + 10),
                    },
                    src: getLoc('c[0]', 12 + 10),
                },
            },
            {
                lhs: { id: 'b', src: getLoc('b', 8 + 10) },
                rhs: {
                    identifier: {id: 'd', src: getLoc('d', 18 + 10) },
                    'from': {
                        litType: AstLiteralType.Integer,
                        value: '1',
                        src: getLoc('1', 20 + 10),
                    },
                    'to': {
                        litType: AstLiteralType.Integer,
                        value: '1',
                        src: getLoc('1', 20 + 10),
                    },
                    src: getLoc('d[1]', 18 + 10),
                },
            }
        ])

        /*expectAstModule("@width(10) a.b.c", [
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
        ])*/
    })

    it('should elaborate to AstExpr', () => {
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
            litType: AstLiteralType.Constant,
            src: getLoc("4'01xz", 1 + 14),
        })


        expectAstExpr('a[2:3]', {
            identifier: { id: 'a', src: getLoc('a', 1 + 14) },
            from: {
                litType: AstLiteralType.Integer,
                value: '2',
                src: getLoc('2', 3 + 14),
            },
            to: {
                litType: AstLiteralType.Integer,
                value: '3',
                src: getLoc('3', 5 + 14),
            },
            src: getLoc('a[2:3]', 1 + 14),
        })

        expectAstExpr('a[2]', {
            identifier: { id: 'a', src: getLoc('a', 1 + 14) },
            from: {
                litType: AstLiteralType.Integer,
                value: '2',
                src: getLoc('2', 3 + 14),
            },
            to: {
                litType: AstLiteralType.Integer,
                value: '2',
                src: getLoc('2', 3 + 14),
            },
            src: getLoc('a[2]', 1 + 14),
        })

        expectAstExpr('$R() {}', {
            module: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: {
                litType: AstLiteralType.Integer,
                value: '1',
            },
            parameters: [],
            dict: {entries: [], star: false, src: getLoc('{}', 6 + 14)},
            src: getLoc('$R() {}', 1 + 14),
        })

        expectAstExpr('$R()[2] {}', {
            module: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: {
                litType: AstLiteralType.Integer,
                value: '2',
                src: getLoc('2', 6 + 14)
            },
            parameters: [],
            dict: {entries: [], star: false, src: getLoc('{}', 9 + 14)},
            src: getLoc('$R()[2] {}', 1 + 14),
        })

        expectAstExpr("$R(10k) {}", {
            module: { id: '$R', src: getLoc('$R', 1 + 14) },
            parameters: [
                {
                    name: null,
                    value: {
                        value: '10k',
                        litType: AstLiteralType.Unit,
                        src: getLoc('10k', 4 + 14),
                    }
                }
            ],
            width: {
                litType: AstLiteralType.Integer,
                value: '1',
            },
            dict: {entries: [], star: false, src: getLoc('{}', 9 + 14)},
            src: getLoc('$R(10k) {}', 1 + 14),
        })

        expectAstExpr("$R() {A}", {
            module: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: {
                litType: AstLiteralType.Integer,
                value: '1',
            },
            parameters: [],
            dict: {
                entries: [
                    {
                        identifier: { id: 'A', src: getLoc('A', 7 + 14) },
                        expr: { id: 'A', src: getLoc('A', 7 + 14) },
                    }
                ],
                star: false,
                src: getLoc('{A}', 6 + 14),
            },
            src: getLoc('$R() {A}', 1 + 14),
        })

        expectAstExpr("$R() {A=a}", {
            module: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: {
                litType: AstLiteralType.Integer,
                value: '1',
            },
            parameters: [],
            dict: {
                entries: [
                    {
                        identifier: { id: 'A', src: getLoc('A', 7 + 14) },
                        expr: { id: 'a', src: getLoc('a', 9 + 14) },
                    }
                ],
                star: false,
                src: getLoc('{A=a}', 6 + 14),
            },
            src: getLoc('$R() {A=a}', 1 + 14),
        })

        expectAstExpr("$R() {A, B=b}", {
            module: { id: '$R', src: getLoc('$R', 1 + 14) },
            width: {
                litType: AstLiteralType.Integer,
                value: '1',
            },
            parameters: [],
            dict: {
                entries: [
                    {
                        identifier: { id: 'A', src: getLoc('A', 7 + 14) },
                        expr: { id: 'A', src: getLoc('A', 7 + 14) },
                    },
                    {
                        identifier: { id: 'B', src: getLoc('B', 10 + 14) },
                        expr: { id: 'b', src: getLoc('b', 12 + 14) },
                    }
                ],
                star: false,
                src: getLoc('{A, B=b}', 6 + 14)
            },
            src: getLoc('$R() {A, B=b}', 1 + 14),
        })
    })
})
