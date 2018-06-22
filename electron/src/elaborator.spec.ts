import { expect } from 'chai'
import { elaborate } from './elaborator'
import { Ast, AstLiteralType, AstDeclType, AstStmt, AstExpr,
         IAstDesign, IAstDeclStmt, IAstIdentifier, IAstLiteral, AstBinaryOp,
         IAstAttribute } from './ast'

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
    const res = elaborate('elatorator.spec.ts', text)
    expect(res.errors.length).to.equal(0)
    expect(res.ast).to.deep.equal(ast)
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
    it('should elaborate imports', () => {
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

    it('should elaborate modules', () => {
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

    describe('should elaborate statements', () => {
        it('should elaborate declarations', () => {
            expectAstModule('net a', [
                {
                    ast: Ast.Decl,
                    attributes: [],
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
                    attributes: [],
                    identifier: makeIdentifier('a', 8 + 10),
                    declType: AstDeclType.Net,
                    width: makeInteger(2, 5 + 10),
                }
            ])

            expectAstModule('net a, b', [
                {
                    ast: Ast.Decl,
                    attributes: [],
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
                    attributes: [],
                    identifier: makeIdentifier('b', 8 + 10),
                    declType: AstDeclType.Net,
                    width: {
                        ast: Ast.Literal,
                        litType: AstLiteralType.Integer,
                        value: '1',
                    },
                }
            ])

            const a_decl: IAstDeclStmt = {
                ast: Ast.Decl,
                attributes: [],
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
                attributes: [],
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
        })

        it('should elaborate to SetAttributes', () => {
            const widthAttr: IAstAttribute = {
                ast: Ast.Attribute,
                name: {
                    ast: Ast.Identifier,
                    id: 'width',
                    src: getLoc('@width', 1 + 10)
                },
                parameters: [
                    {
                        ast: Ast.Param,
                        name: null,
                        value: makeInteger(10, 8 + 10),
                    }
                ]
            }

            expectAstModule('@width(10) net a, b', [
                {
                    ast: Ast.SetAttributes,
                    attributes: [ widthAttr ],
                    statements: [
                        {
                            ast: Ast.Decl,
                            attributes: [],
                            identifier: makeIdentifier('a', 16 + 10),
                            declType: AstDeclType.Net,
                            width: {
                                ast: Ast.Literal,
                                litType: AstLiteralType.Integer,
                                value: '1',
                            },
                        },
                        {
                            ast: Ast.Decl,
                            attributes: [],
                            identifier: makeIdentifier('b', 19 + 10),
                            declType: AstDeclType.Net,
                            width: {
                                ast: Ast.Literal,
                                litType: AstLiteralType.Integer,
                                value: '1',
                            },
                        }
                    ],
                    fqns: [],
                }
            ])

            expectAstModule("@width(10) a.b.c", [
                {
                    ast: Ast.SetAttributes,
                    attributes: [ widthAttr ],
                    statements: [],
                    fqns: [
                        {
                            ast: Ast.FQN,
                            fqn: [
                                makeIdentifier('a', 12 + 10),
                                makeIdentifier('b', 14 + 10),
                                makeIdentifier('c', 16 + 10),
                            ]
                        }
                    ]
                }
            ])
        })
    })

    describe('should elaborate to expressions', () => {
        describe('should elaborate literals', () => {
            it('should elaborate Integer', () => {
                expectAstExpr('0', makeInteger(0, 1 + 14))
            })

            it('should elaborate Constant', () => {
                expectAstExpr("4'01xz", {
                    ast: Ast.Literal,
                    value: "4'01xz",
                    litType: AstLiteralType.Constant,
                    src: getLoc("4'01xz", 1 + 14),
                })
            })

            it('should elaborate Unit', () => {
                expectAstExpr('10k', {
                    ast: Ast.Literal,
                    value: '10k',
                    litType: AstLiteralType.Unit,
                    src: getLoc('10k', 1 + 14),
                })

                expectAstExpr('2.2k', {
                    ast: Ast.Literal,
                    value: '2.2k',
                    litType: AstLiteralType.Unit,
                    src: getLoc('2.2k', 1 + 14),
                })
            })

            it('should elaborate String', () => {
                expectAstExpr('"string"', makeString('string', 1 + 14))
            })

            it('should elaborate Real', () => {
                expectAstExpr('1.26e-12', {
                    ast: Ast.Literal,
                    value: '1.26e-12',
                    litType: AstLiteralType.Real,
                    src: getLoc('1.26e-12', 1 + 14),
                })
            })

            it('should elaborate Boolean', () => {
                expectAstExpr('true', {
                    ast: Ast.Literal,
                    value: 'true',
                    litType: AstLiteralType.Boolean,
                    src: getLoc('true', 1 + 14),
                })

                expectAstExpr('false', {
                    ast: Ast.Literal,
                    value: 'false',
                    litType: AstLiteralType.Boolean,
                    src: getLoc('false', 1 + 14),
                })
            })
        })

        describe('should elaborate binops', () => {
            it('should elaborate Add', () => {
                expectAstExpr('1 + 1', {
                    ast: Ast.BinOp,
                    op: AstBinaryOp.Add,
                    lhs: makeInteger(1, 1 + 14),
                    rhs: makeInteger(1, 5 + 14),
                })
            })

            it('should elaborate Sub', () => {
                expectAstExpr('1 - 1', {
                    ast: Ast.BinOp,
                    op: AstBinaryOp.Sub,
                    lhs: makeInteger(1, 1 + 14),
                    rhs: makeInteger(1, 5 + 14),
                })
            })

            it('should elaborate Mul', () => {
                expectAstExpr('1 * 1', {
                    ast: Ast.BinOp,
                    op: AstBinaryOp.Mul,
                    lhs: makeInteger(1, 1 + 14),
                    rhs: makeInteger(1, 5 + 14),
                })
            })

            it('should elaborate Shl', () => {
                expectAstExpr('1 << 1', {
                    ast: Ast.BinOp,
                    op: AstBinaryOp.Shl,
                    lhs: makeInteger(1, 1 + 14),
                    rhs: makeInteger(1, 6 + 14),
                })
            })

            it('should elaborate Shr', () => {
                expectAstExpr('1 >> 1', {
                    ast: Ast.BinOp,
                    op: AstBinaryOp.Shr,
                    lhs: makeInteger(1, 1 + 14),
                    rhs: makeInteger(1, 6 + 14),
                })
            })
        })

        it('should elaborate Tuple', () => {
            expectAstExpr('(a, b, c)', {
            ast: Ast.Tuple,
            expressions: [
                makeIdentifier('a', 2 + 14),
                makeIdentifier('b', 5 + 14),
                makeIdentifier('c', 8 + 14),
            ],
            src: getLoc('(a, b, c)', 1 + 14),
            })
        })

        it('should elaborate Identifier', () => {
            expectAstExpr('helloThere', makeIdentifier('helloThere', 1 + 14))
            expectAstExpr("'+3.3V", makeIdentifier("'+3.3V", 1 + 14))
        })

        it('should elaborate Ref', () => {
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
        })

        it('should elaborate AnonymousMod', () => {
            expectAstExpr('module { input[1] a; output[1] y}', {
                ast: Ast.AnonymousMod,
                statements: [
                    {
                        ast: Ast.Decl,
                        attributes: [],
                        declType: AstDeclType.Input,
                        width: makeInteger(1, 16 + 14),
                        identifier: makeIdentifier('a', 19 + 14),
                    },
                    {
                        ast: Ast.Decl,
                        attributes: [],
                        declType: AstDeclType.Output,
                        width: makeInteger(1, 29 + 14),
                        identifier: makeIdentifier('y', 32 + 14),
                    }
                ]
            })
        })

        it('should elaborate ModInst', () => {
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
})
