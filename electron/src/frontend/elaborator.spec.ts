import { expect } from 'chai'
import { File } from '../file'
import * as ast from './ast'
import { DiagnosticCollector, SrcLoc, ISrcLoc, emptySrcLoc,
         Pos, IPos } from '../diagnostic';

function getLoc(text: string, start: IPos): ISrcLoc {
    const lines = text.split('\n')
    const lineDelta = lines.length - 1
    const col = lines.length > 1 ? lines[lines.length - 1].length
        : start.column + text.length - 1
    return SrcLoc(start, Pos(start.line + lineDelta, col))
}

function expectAst(text: string, ast: ast.IModule[]) {
    const dc = new DiagnosticCollector()
    const f = new File(dc, 'elaborator.spec.ts', text)
    f.lex().parse().elaborate()
    for (let d of dc.getDiagnostics()) {
        console.log(d.message)
    }
    expect(f.getAst()).to.deep.equal(ast)
}

const $R = ast.Module('$R', [
    ast.Param('RESISTANCE', 'Ohm',
              getLoc('RESISTANCE', Pos(1, 11)),
              getLoc('Ohm', Pos(1, 23))),
    ast.Port('A', 'analog', ast.Integer(1), getLoc('A', Pos(1, 36))),
    ast.Port('B', 'analog', ast.Integer(1), getLoc('B', Pos(1, 46)))
], getLoc('$R', Pos(1, 8)))

function expectAstModule(text: string, stmts: ast.Stmt[]) {
    const mods: ast.IModule[] = []
    mods.push($R)
    mods.push(ast.Module('A', stmts, getLoc('A', Pos(2, 8))))
    expectAst(`module $R(RESISTANCE: Ohm) {analog A; analog B}\nmodule A {\n${text}\n}`,
              mods)
}

function expectAstExpr(text: string, e: ast.Expr) {
    const a = ast.Net('a', ast.Integer(1), getLoc('a', Pos(3, 5)))
    expectAstModule('net a = \n' + text, [
        a,
        ast.Assign(ast.Ref(a, getLoc('a', Pos(3, 5))), e)
    ])
}

describe('Elaborator', () => {
    describe('Imports', () => {
        it('should elaborate `import A from "./file"`', () => {
            expectAst('import A from "./file"', [])
        })
    })

    describe('Modules', () => {
        it('should elaborate `module A {}`', () => {
            expectAst('module A {}', [
                ast.Module('A', [], getLoc('A', Pos(1, 8)))
            ])
        })

        it('should elaborate `export module A {}`', () => {
            const A = ast.Module('A', [], getLoc('A', Pos(1, 15)))
            A.exported = true
            expectAst('export module A {}', [A])
        })

        it('should elaborate `declare module A {}`', () => {
            const A = ast.Module('A', [], getLoc('A', Pos(1, 16)))
            A.declaration = true
            expectAst('declare module A {}', [A])
        })

        it('should elaborate `@bom("Yago", "XYZ") module A {}`', () => {
            const A = ast.Module('A', [], getLoc('A', Pos(1, 28)))
            A.attrs.push(
                ast.Attr('bom', [
                    ast.String('Yago', getLoc('"Yago"', Pos(1, 6))),
                    ast.String('XYZ', getLoc('"XYZ"', Pos(1, 14)))
                ], getLoc('@bom', Pos(1, 1))))
            expectAst('@bom("Yago", "XYZ") module A {}', [A])
        })

        it('should elaborate `module A(R: Ohm) {}`', () => {
            const A = ast.Module('A', [], getLoc('A', Pos(1, 8)))
            A.params.push(
                ast.Param('R', 'Ohm',
                          getLoc('R', Pos(1, 10)),
                          getLoc('Ohm', Pos(1, 13))))
            expectAst('module A(R: Ohm) {}', [A])
        })
    })

    describe('Statements', () => {
        describe('Declarations', () => {
            it('should elaborate `const a`', () => {
                expectAstModule('const a', [
                    ast.Const('a', getLoc('a', Pos(3, 7)))
                ])
            })

            it('should elaborate `inout \'+3.3V`', () => {
                expectAstModule("inout '+3.3V", [
                    ast.Port('+3.3V', 'inout', ast.Integer(1), getLoc("'+3.3V", Pos(3, 7)))
                ])
            })

            it('should elaborate `analog[2] a`', () => {
                expectAstModule('analog[2] a', [
                    ast.Port('a', 'analog', ast.Integer(2, getLoc('2', Pos(3, 8))),
                            getLoc('a', Pos(3, 11)))
                ])
            })

            it('should elaborate `input a, b`', () => {
                expectAstModule('input a, b', [
                    ast.Port('a', 'input', ast.Integer(1), getLoc('a', Pos(3, 7))),
                    ast.Port('b', 'input', ast.Integer(1), getLoc('b', Pos(3, 10)))
                ])
            })

            it('should elaborate `output a = b`', () => {
                const a = ast.Net('a', ast.Integer(1), getLoc('a', Pos(3, 5)))
                const b = ast.Port('b', 'output', ast.Integer(1), getLoc('b', Pos(3, 15)))
                expectAstModule('net a; output b = a', [
                    a, b, ast.Assign(ast.Ref(b, getLoc('b', Pos(3, 15))),
                                     ast.Ref(a, getLoc('a', Pos(3, 19))))
                ])
            })

            it('should elaborate `net a, b = c, d`', () => {
                const a = ast.Net('a', ast.Integer(1), getLoc('a', Pos(3, 15)))
                const b = ast.Net('b', ast.Integer(1), getLoc('b', Pos(3, 18)))
                const c = ast.Net('c', ast.Integer(1), getLoc('c', Pos(3, 5)))
                const d = ast.Net('d', ast.Integer(1), getLoc('d', Pos(3, 8)))
                expectAstModule('net c, d; net a, b = c, d', [
                    c, d, a, b,
                    ast.Assign(ast.Ref(a, getLoc('a', Pos(3, 15))),
                               ast.Ref(c, getLoc('c', Pos(3, 22)))),
                    ast.Assign(ast.Ref(b, getLoc('b', Pos(3, 18))),
                               ast.Ref(d, getLoc('d', Pos(3, 25))))
                ])
            })

            it('should elaborate to `@rotate(90) cell a, b`', () => {
                const widthAttr = ast.Attr('rotate', [
                    ast.Integer(90, getLoc('90', Pos(3, 9)))
                ], getLoc('@rotate', Pos(3, 1)))

                const cells = [
                    ast.Cell('a', ast.Integer(1), getLoc('a', Pos(3, 18))),
                    ast.Cell('b', ast.Integer(1), getLoc('b', Pos(3, 21)))
                ]
                cells[0].attrs.push(widthAttr)
                cells[1].attrs.push(widthAttr)
                expectAstModule('@rotate(90) cell a, b', cells)
            })
        })
    })

    describe('Expressions', () => {
        describe('Literals', () => {
            it('should elaborate Integer', () => {
                expectAstExpr('0', ast.Integer(0, getLoc('0', Pos(4, 1))))
            })

            it('should elaborate BitVector', () => {
                expectAstExpr("4'01xz", ast.BitVector(['0', '1', 'x', 'z'],
                                                      getLoc("4'01xz", Pos(4, 1))))
            })

            it('should elaborate Unit', () => {
                expectAstExpr('10k', ast.Unit('10k', getLoc('10k', Pos(4, 1))))

                expectAstExpr('2.2k', ast.Unit('2.2k', getLoc('2.2k', Pos(4, 1))))
            })

            it('should elaborate String', () => {
                expectAstExpr('"string"',
                              ast.String('string', getLoc('"string"', Pos(4, 1))))
            })

            it('should elaborate Real', () => {
                expectAstExpr('1.26e-12', ast.Real(1.26e-12,
                                                   getLoc('1.26e-12', Pos(4, 1))))
            })

            it('should elaborate Boolean', () => {
                expectAstExpr('true', ast.Bool(true, getLoc('true', Pos(4, 1))))
                expectAstExpr('false', ast.Bool(false, getLoc('false', Pos(4, 1))))
            })
        })

        describe('Operators', () => {
            it('should elaborate Add', () => {
                expectAstExpr('1 + 1',
                              ast.BinOp('+',
                                        ast.Integer(1, getLoc('1', Pos(4, 1))),
                                        ast.Integer(1, getLoc('1', Pos(4, 5)))))
            })

            it('should elaborate Sub', () => {
                expectAstExpr('1 - 1',
                              ast.BinOp('-',
                                        ast.Integer(1, getLoc('1', Pos(4, 1))),
                                        ast.Integer(1, getLoc('1', Pos(4, 5)))))
            })

            it('should elaborate Mul', () => {
                expectAstExpr('1 * 1',
                              ast.BinOp('*',
                                        ast.Integer(1, getLoc('1', Pos(4, 1))),
                                        ast.Integer(1, getLoc('1', Pos(4, 5)))))
            })

            it('should elaborate Shl', () => {
                expectAstExpr('1 << 1',
                              ast.BinOp('<<',
                                        ast.Integer(1, getLoc('1', Pos(4, 1))),
                                        ast.Integer(1, getLoc('1', Pos(4, 6)))))
            })

            it('should elaborate Shr', () => {
                expectAstExpr('1 >> 1',
                              ast.BinOp('>>',
                                        ast.Integer(1, getLoc('1', Pos(4, 1))),
                                        ast.Integer(1, getLoc('1', Pos(4, 6)))))
            })
        })

        it('should elaborate Tuple', () => {
            const a = ast.Net('a', ast.Integer(1), getLoc('a', Pos(3, 5)))
            const b = ast.Net('b', ast.Integer(1), getLoc('b', Pos(3, 8)))
            const c = ast.Net('c', ast.Integer(1), getLoc('c', Pos(3, 11)))
            const d = ast.Net('d', ast.Integer(1), getLoc('d', Pos(3, 14)))
            expectAstModule('net a, b, c, d;\nd = (a, b, c)', [
                a, b, c, d, ast.Assign(
                    ast.Ref(d, getLoc('d', Pos(4, 1))),
                    ast.Tuple([
                        ast.Ref(a, getLoc('a', Pos(4, 6))),
                        ast.Ref(b, getLoc('b', Pos(4, 9))),
                        ast.Ref(c, getLoc('c', Pos(4, 12))),
                    ], getLoc('(a, b, c)', Pos(4, 5))))
            ])
        })

        it('should elaborate Range', () => {
            const a = ast.Net('a', ast.Integer(1), getLoc('a', Pos(3, 5)))
            const b = ast.Net('b', ast.Integer(1), getLoc('b', Pos(3, 8)))
            expectAstModule('net a, b; a = b[2:3]', [
                a, b, ast.Assign(ast.Ref(a, getLoc('a', Pos(3, 11))),
                                 ast.Range(ast.Ref(b, getLoc('b', Pos(3, 15))),
                                           ast.Integer(2, getLoc('2', Pos(3, 17))),
                                           ast.Integer(3, getLoc('3', Pos(3, 19))),
                                           getLoc('[2:3]', Pos(3, 16))))
            ])

            expectAstModule('net a, b; a = b[2]', [
                a, b, ast.Assign(ast.Ref(a, getLoc('a', Pos(3, 11))),
                                 ast.Range(ast.Ref(b, getLoc('b', Pos(3, 15))),
                                           ast.Integer(2, getLoc('2', Pos(3, 17))),
                                           ast.Integer(2, getLoc('2', Pos(3, 17))),
                                           getLoc('[2]', Pos(3, 16))))
            ])
        })

        describe('Inst', () => {
            it('should elaborate `$R(10k) {}`', () => {
                const ref$R = ast.Ref($R, getLoc('$R', Pos(4, 1)))
                expectAstExpr('$R() {}',
                              ast.Inst(ref$R, [], [], getLoc('$R', Pos(4, 1))))

                expectAstExpr('$R(10k) {}',
                              ast.Inst(ref$R, [
                                  [
                                      ast.Ref($R.params[0], getLoc('10k', Pos(4, 4))),
                                      ast.Unit('10k', getLoc('10k', Pos(4, 4)))
                                  ]
                              ], [], getLoc('$R', Pos(4, 1))))

                expectAstExpr('$R(RESISTANCE=10k) {}',
                              ast.Inst(ref$R, [
                                  [
                                      ast.Ref($R.params[0], getLoc('10k', Pos(4, 15))),
                                      ast.Unit('10k', getLoc('10k', Pos(4, 15)))
                                  ]
                              ], [], getLoc('$R', Pos(4, 1))))
            })

            it('should elaborate `$R() {A}`', () => {
                const ref$R = ast.Ref($R, getLoc('$R', Pos(3, 21)))
                const A = ast.Net('A', ast.Integer(1), getLoc('A', Pos(3, 5)))
                const B = ast.Net('B', ast.Integer(1), getLoc('B', Pos(3, 8)))
                const r1 = ast.Cell('r1', ast.Integer(1), getLoc('r1', Pos(3, 16)))
                expectAstModule('net A, B; cell r1 = $R {A}', [
                    A, B, r1,
                    ast.Assign(ast.Ref(r1, getLoc('r1', Pos(3, 16))),
                               ast.Inst(ref$R, [], [
                                   [
                                       ast.Ref($R.ports[0], getLoc('A', Pos(3, 25))),
                                       ast.Ref(A, getLoc('A', Pos(3, 25)))
                                   ]
                               ], getLoc('$R', Pos(3, 21))))
                ])
            })

            it('should elaborate `$R() {A, B=B}`', () => {
                const ref$R = ast.Ref($R, getLoc('$R', Pos(3, 21)))
                const A = ast.Net('A', ast.Integer(1), getLoc('A', Pos(3, 5)))
                const B = ast.Net('B', ast.Integer(1), getLoc('B', Pos(3, 8)))
                const r1 = ast.Cell('r1', ast.Integer(1), getLoc('r1', Pos(3, 16)))
                expectAstModule('net A, B; cell r1 = $R {A, B=B}', [
                    A, B, r1,
                    ast.Assign(ast.Ref(r1, getLoc('r1', Pos(3, 16))),
                               ast.Inst(ref$R, [], [
                                   [
                                       ast.Ref($R.ports[0], getLoc('A', Pos(3, 25))),
                                       ast.Ref(A, getLoc('A', Pos(3, 25)))
                                   ],
                                   [
                                       ast.Ref($R.ports[1], getLoc('B', Pos(3, 28))),
                                       ast.Ref(B, getLoc('B', Pos(3, 30)))
                                   ]
                               ], getLoc('$R', Pos(3, 21))))
                ])
            })

            it('should elaborate `$R() {A, *}`', () => {
                const ref$R = ast.Ref($R, getLoc('$R', Pos(3, 21)))
                const A = ast.Net('A', ast.Integer(1), getLoc('A', Pos(3, 5)))
                const B = ast.Net('B', ast.Integer(1), getLoc('B', Pos(3, 8)))
                const r1 = ast.Cell('r1', ast.Integer(1), getLoc('r1', Pos(3, 16)))
                expectAstModule('net A, B; cell r1 = $R {A, *}', [
                    A, B, r1,
                    ast.Assign(ast.Ref(r1, getLoc('r1', Pos(3, 16))),
                               ast.Inst(ref$R, [], [
                                   [
                                       ast.Ref($R.ports[0], getLoc('A', Pos(3, 25))),
                                       ast.Ref(A, getLoc('A', Pos(3, 25)))
                                   ],
                                   [
                                       ast.Ref($R.ports[1], getLoc('*', Pos(3, 28))),
                                       ast.Ref(B, getLoc('*', Pos(3, 28)))
                                   ]
                               ], getLoc('$R', Pos(3, 21))))
                ])
            })

            it('should elaborate `$R() {*}`', () => {
                const ref$R = ast.Ref($R, getLoc('$R', Pos(3, 21)))
                const A = ast.Net('A', ast.Integer(1), getLoc('A', Pos(3, 5)))
                const B = ast.Net('B', ast.Integer(1), getLoc('B', Pos(3, 8)))
                const r1 = ast.Cell('r1', ast.Integer(1), getLoc('r1', Pos(3, 16)))
                expectAstModule('net A, B; cell r1 = $R {*}', [
                    A, B, r1,
                    ast.Assign(ast.Ref(r1, getLoc('r1', Pos(3, 16))),
                               ast.Inst(ref$R, [], [
                                   [
                                       ast.Ref($R.ports[0], getLoc('*', Pos(3, 25))),
                                       ast.Ref(A, getLoc('*', Pos(3, 25)))
                                   ],
                                   [
                                       ast.Ref($R.ports[1], getLoc('*', Pos(3, 25))),
                                       ast.Ref(B, getLoc('*', Pos(3, 25)))
                                   ]
                               ], getLoc('$R', Pos(3, 21))))
                ])
            })

            it('should elaborate `cell { input A=a; output Y }`', () => {
                const a = ast.Net('a', ast.Integer(1), getLoc('a', Pos(3, 5)))
                const Y = ast.Net('Y', ast.Integer(1), getLoc('Y', Pos(3, 8)))
                const inv = ast.Cell('inv', ast.Integer(1), getLoc('inv', Pos(3, 16)))
                const mod = ast.Module(undefined, [
                    ast.Port('A', 'input', ast.Integer(1), getLoc('A', Pos(3, 35))),
                    ast.Port('Y', 'output', ast.Integer(1), getLoc('Y', Pos(3, 47))),
                ], getLoc('cell', Pos(3, 22)))
                mod.declaration = true

                expectAstModule('net a, Y; cell inv = cell { input A=a; output Y}', [
                    a, Y, inv,
                    ast.Assign(ast.Ref(inv, getLoc('inv', Pos(3, 16))),
                               ast.Inst(ast.Ref(mod), [], [
                                   [
                                       ast.Ref(mod.ports[0], getLoc('A', Pos(3, 35))),
                                       ast.Ref(a, getLoc('a', Pos(3, 37)))
                                   ],
                                   [
                                       ast.Ref(mod.ports[1], getLoc('Y', Pos(3, 47))),
                                       ast.Ref(Y, getLoc('Y', Pos(3, 47)))
                                   ]
                               ], getLoc('cell', Pos(3, 22))))
                ])
            })

            it('should elaborate `cell { analog A=a; @right inout Y }`', () => {
                const a = ast.Net('a', ast.Integer(1), getLoc('a', Pos(3, 5)))
                const Y = ast.Net('Y', ast.Integer(1), getLoc('Y', Pos(3, 8)))
                const inv = ast.Cell('inv', ast.Integer(1), getLoc('inv', Pos(3, 16)))
                const mod = ast.Module(undefined, [
                    ast.Port('A', 'analog', ast.Integer(1), getLoc('A', Pos(3, 36))),
                    ast.Port('Y', 'inout', ast.Integer(1), getLoc('Y', Pos(3, 54))),
                ], getLoc('cell', Pos(3, 22)))
                mod.declaration = true
                mod.ports[1].attrs.push(ast.Attr('right', [], getLoc('@right', Pos(3, 41))))

                expectAstModule('net a, Y; cell inv = cell { analog A=a; @right inout Y}', [
                    a, Y, inv,
                    ast.Assign(ast.Ref(inv, getLoc('inv', Pos(3, 16))),
                               ast.Inst(ast.Ref(mod), [], [
                                   [
                                       ast.Ref(mod.ports[0], getLoc('A', Pos(3, 36))),
                                       ast.Ref(a, getLoc('a', Pos(3, 38)))
                                   ],
                                   [
                                       ast.Ref(mod.ports[1], getLoc('Y', Pos(3, 54))),
                                       ast.Ref(Y, getLoc('Y', Pos(3, 54)))
                                   ]
                               ], getLoc('cell', Pos(3, 22))))
                ])
            })
        })
    })
})
