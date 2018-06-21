import { expect } from 'chai'
import { elaborate } from './elaborator'
import { Ast, AstLiteralType, AstDeclType, AstStmt, AstExpr,
    IAstDesign, IAstDeclStmt, IAstIdentifier, IAstLiteral } from './ast'

function getLoc(text: string, offset: number) {
    return {
        startLine: 1,
        startColumn: offset,
        endLine: 1,
        endColumn: offset + text.length - 1,
    }
}

function makeIdentifier(name: string, offset: number): IAstIdentifier {
    return {
        ast: Ast.Identifier,
        id: name,
        src: getLoc(name, offset),
    }
}

function makeInteger(int: number, offset: number): IAstLiteral {
    const value = int.toString()
    return {
        ast: Ast.Literal,
        litType: AstLiteralType.Integer,
        value,
        src: getLoc(value, offset),
    }
}

function makeString(str: string, offset: number): IAstLiteral {
    const value = '"' + str + '"'
    return {
        ast: Ast.Literal,
        litType: AstLiteralType.String,
        value,
        src: getLoc(value, offset),
    }
}

function expectAst(text: string, ast: IAstDesign) {
    expect(elaborate(text)).to.deep.equal(ast)
}

function expectAstModule(text: string, smts: AstStmt[]) {
    expectAst('module A {' + text + '}', {
        ast: Ast.Design,
        imports: [],
        modules: [
            {
                ast: Ast.Module,
                attributes: [],
                exported: false,
                declaration: false,
                identifier: makeIdentifier('A', 8),
                parameters: [],
                statements: smts
            }
        ]
    })
}

function expectAstExpr(text: string, e: AstExpr) {
    expectAstModule('a = ' + text, [
        {
            ast: Ast.Assign,
            lhs: makeIdentifier('a', 1 + 10),
            rhs: e,
        }
    ])
}

describe('Elaborator', () => {
    it('should elaborate to IAstImport', () => {
        expectAst('import a, b from "package"', {
            ast: Ast.Design,
            imports: [
                {
                    ast: Ast.Import,
                    identifiers: [
                        makeIdentifier('a', 8),
                        makeIdentifier('b', 11),
                    ],
                    package: 'package',
                    src: getLoc('"package"', 18),
                },
            ],
            modules: [],
        })

        expectAst('import a from "./file"', {
            ast: Ast.Design,
            imports: [
                {
                    ast: Ast.Import,
                    identifiers: [ makeIdentifier('a', 8) ],
                    package: './file',
                    src: getLoc('"./file"', 15),
                }
            ],
            modules: [],
        })
    })

    it('should elaborate to IAstModule', () => {
        expectAst('module A {}', {
            ast: Ast.Design,
            imports: [],
            modules: [
                {
                    ast: Ast.Module,
                    attributes: [],
                    exported: false,
                    declaration: false,
                    identifier: makeIdentifier('A', 8),
                    parameters: [],
                    statements: [],
                }
            ],
        })

        expectAst('export module A {}', {
            ast: Ast.Design,
            imports: [],
            modules: [
                {
                    ast: Ast.Module,
                    attributes: [],
                    exported: true,
                    declaration: false,
                    identifier: makeIdentifier('A', 15),
                    parameters: [],
                    statements: [],
                }
            ],
        })

        expectAst('declare module A {}', {
            ast: Ast.Design,
            imports: [],
            modules: [
                {
                    ast: Ast.Module,
                    attributes: [],
                    exported: false,
                    declaration: true,
                    identifier: makeIdentifier('A', 16),
                    parameters: [],
                    statements: [],
                }
            ],
        })

        expectAst('@bom("Yago", "XYZ") module A {}', {
            ast: Ast.Design,
            imports: [],
            modules: [
                {
                    ast: Ast.Module,
                    attributes: [
                        {
                            ast: Ast.Attribute,
                            name: {
                                ast: Ast.Identifier,
                                id: 'bom',
                                src: getLoc('@bom', 1)
                            },
                            parameters: [
                                {
                                    ast: Ast.Param,
                                    name: null,
                                    value: makeString('Yago', 6),
                                },
                                {
                                    ast: Ast.Param,
                                    name: null,
                                    value: makeString('XYZ', 14)
                                }
                            ]
                        }
                    ],
                    exported: false,
                    declaration: false,
                    identifier: makeIdentifier('A', 28),
                    parameters: [],
                    statements: [],
                }
            ],
        })
    })

    it('should elaborate to AstStatement', () => {
        expectAstModule('net a', [
            {
                ast: Ast.Decl,
                identifier: makeIdentifier('a', 5 + 10),
                declType: AstDeclType.Net,
                width: {
                    ast: Ast.Literal,
                    litType: AstLiteralType.Integer,
                    value: '1',
                },
            }
        ])

        expectAstModule('net[2] a', [
            {
                ast: Ast.Decl,
                identifier: makeIdentifier('a', 8 + 10),
                declType: AstDeclType.Net,
                width: makeInteger(2, 5 + 10),
            }
        ])

        expectAstModule('net a, b', [
            {
                ast: Ast.Decl,
                identifier: makeIdentifier('a', 5 + 10),
                declType: AstDeclType.Net,
                width: {
                    ast: Ast.Literal,
                    litType: AstLiteralType.Integer,
                    value: '1',
                },
            },
            {
                ast: Ast.Decl,
                identifier: makeIdentifier('b', 8 + 10),
                declType: AstDeclType.Net,
                width: {
                    ast: Ast.Literal,
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

        const a_decl: IAstDeclStmt = {
            ast: Ast.Decl,
            identifier: makeIdentifier('a', 5 + 10),
            declType: AstDeclType.Net,
            width: {
                ast: Ast.Literal,
                litType: AstLiteralType.Integer,
                value: '1',
            },
        }
        const b_decl: IAstDeclStmt = {
            ast: Ast.Decl,
            identifier: makeIdentifier('b', 8 + 10),
            declType: AstDeclType.Net,
            width: {
                ast: Ast.Literal,
                litType: AstLiteralType.Integer,
                value: '1',
            },
        }

        expectAstModule('net a = c', [
            a_decl,
            {
                ast: Ast.Assign,
                lhs: makeIdentifier('a', 5 + 10),
                rhs: makeIdentifier('c', 9 + 10),
            }
        ])

        expectAstModule('net a, b = c, d', [
            a_decl, b_decl,
            {
                ast: Ast.Assign,
                lhs: makeIdentifier('a', 5 + 10),
                rhs: makeIdentifier('c', 12 + 10),
            },
            {
                ast: Ast.Assign,
                lhs: makeIdentifier('b', 8 + 10),
                rhs: makeIdentifier('d', 15 + 10),
            }
        ])

        expectAstModule('net a, b = c[0], d[1]', [
            a_decl, b_decl,
            {
                ast: Ast.Assign,
                lhs: makeIdentifier('a', 5 + 10),
                rhs: {
                    ast: Ast.Ref,
                    identifier: makeIdentifier('c', 12 + 10),
                    from: makeInteger(0, 14 + 10),
                    to: makeInteger(0, 14 + 10),
                    src: getLoc('c[0]', 12 + 10),
                },
            },
            {
                ast: Ast.Assign,
                lhs: makeIdentifier('b', 8 + 10),
                rhs: {
                    ast: Ast.Ref,
                    identifier: makeIdentifier('d', 18 + 10),
                    from: makeInteger(1, 20 + 10),
                    to: makeInteger(1, 20 + 10),
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
            ast: Ast.Tuple,
            expressions: [
                makeIdentifier('a', 2 + 14),
                makeIdentifier('b', 5 + 14),
                makeIdentifier('c', 8 + 14),
            ],
            src: getLoc('(a, b, c)', 1 + 14),
        })

        expectAstExpr("4'01xz", {
            ast: Ast.Literal,
            value: "4'01xz",
            litType: AstLiteralType.Constant,
            src: getLoc("4'01xz", 1 + 14),
        })


        expectAstExpr('a[2:3]', {
            ast: Ast.Ref,
            identifier: makeIdentifier('a', 1 + 14),
            from: makeInteger(2, 3 + 14),
            to: makeInteger(3, 5 + 14),
            src: getLoc('a[2:3]', 1 + 14),
        })

        expectAstExpr('a[2]', {
            ast: Ast.Ref,
            identifier: makeIdentifier('a', 1 + 14),
            from: makeInteger(2, 3 + 14),
            to: makeInteger(2, 3 + 14),
            src: getLoc('a[2]', 1 + 14),
        })

        expectAstExpr('$R() {}', {
            ast: Ast.ModInst,
            module: makeIdentifier('$R', 1 + 14),
            width: {
                ast: Ast.Literal,
                litType: AstLiteralType.Integer,
                value: '1',
            },
            parameters: [],
            dict: {
                ast: Ast.Dict,
                entries: [],
                star: false,
                src: getLoc('{}', 6 + 14)
            },
            src: getLoc('$R() {}', 1 + 14),
        })

        expectAstExpr('$R()[2] {}', {
            ast: Ast.ModInst,
            module: makeIdentifier('$R', 1 + 14),
            width: makeInteger(2, 6 + 14),
            parameters: [],
            dict: {
                ast: Ast.Dict,
                entries: [],
                star: false,
                src: getLoc('{}', 9 + 14)
            },
            src: getLoc('$R()[2] {}', 1 + 14),
        })

        expectAstExpr("$R(10k) {}", {
            ast: Ast.ModInst,
            module: makeIdentifier('$R', 1 + 14),
            parameters: [
                {
                    ast: Ast.Param,
                    name: null,
                    value: {
                        ast: Ast.Literal,
                        value: '10k',
                        litType: AstLiteralType.Unit,
                        src: getLoc('10k', 4 + 14),
                    }
                }
            ],
            width: {
                ast: Ast.Literal,
                litType: AstLiteralType.Integer,
                value: '1',
            },
            dict: {
                ast: Ast.Dict,
                entries: [],
                star: false,
                src: getLoc('{}', 9 + 14)
            },
            src: getLoc('$R(10k) {}', 1 + 14),
        })

        expectAstExpr("$R() {A}", {
            ast: Ast.ModInst,
            module: makeIdentifier('$R', 1 + 14),
            width: {
                ast: Ast.Literal,
                litType: AstLiteralType.Integer,
                value: '1',
            },
            parameters: [],
            dict: {
                ast: Ast.Dict,
                entries: [
                    {
                        ast: Ast.DictEntry,
                        identifier: makeIdentifier('A', 7 + 14),
                        expr: makeIdentifier('A', 7 + 14),
                    }
                ],
                star: false,
                src: getLoc('{A}', 6 + 14),
            },
            src: getLoc('$R() {A}', 1 + 14),
        })

        expectAstExpr("$R() {A=a}", {
            ast: Ast.ModInst,
            module: makeIdentifier('$R', 1 + 14),
            width: {
                ast: Ast.Literal,
                litType: AstLiteralType.Integer,
                value: '1',
            },
            parameters: [],
            dict: {
                ast: Ast.Dict,
                entries: [
                    {
                        ast: Ast.DictEntry,
                        identifier: makeIdentifier('A', 7 + 14),
                        expr: makeIdentifier('a', 9 + 14),
                    }
                ],
                star: false,
                src: getLoc('{A=a}', 6 + 14),
            },
            src: getLoc('$R() {A=a}', 1 + 14),
        })

        expectAstExpr("$R() {A, B=b}", {
            ast: Ast.ModInst,
            module: makeIdentifier('$R', 1 + 14),
            width: {
                ast: Ast.Literal,
                litType: AstLiteralType.Integer,
                value: '1',
            },
            parameters: [],
            dict: {
                ast: Ast.Dict,
                entries: [
                    {
                        ast: Ast.DictEntry,
                        identifier: makeIdentifier('A', 7 + 14),
                        expr: makeIdentifier('A', 7 + 14),
                    },
                    {
                        ast: Ast.DictEntry,
                        identifier: makeIdentifier('B', 10 + 14),
                        expr: makeIdentifier('b', 12 + 14),
                    }
                ],
                star: false,
                src: getLoc('{A, B=b}', 6 + 14)
            },
            src: getLoc('$R() {A, B=b}', 1 + 14),
        })
    })
})
