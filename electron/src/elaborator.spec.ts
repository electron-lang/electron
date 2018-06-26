import { expect } from 'chai'
import { File } from './file'
import * as ast from './ast'
import { DiagnosticCollector, SrcLoc, ISrcLoc, emptySrcLoc,
         Pos, IPos } from './diagnostic';

function getLoc(text: string, start: IPos): ISrcLoc {
    const lines = text.split('\n')
    const lineDelta = lines.length - 1
    const col = lines.length > 1 ? lines[lines.length - 1].length
        : start.column + text.length - 1
    return SrcLoc(start, Pos(start.line + lineDelta, col))
}

function makeIdent(name: string, start: IPos): ast.IIdent {
    return ast.Ident(name, getLoc(name, start))
}

function makeInteger(int: number, start: IPos): ast.IInteger {
    return ast.Integer(int, getLoc(int.toString(), start))
}

function makeString(str: string, start: IPos): ast.IString {
    return ast.String(str, getLoc(`"${str}"`, start))
}

function expectAst(text: string, ast: ast.IDesign) {
    const dc = new DiagnosticCollector()
    const f = new File(dc, 'elaborator.spec.ts', text)
    f.lex().parse().elaborate()
    const ds = dc.getDiagnostics()
    for (let d of ds) {
        console.error(d.message)
    }
    expect(dc.getDiagnostics().length).to.equal(0)
    expect(f.getAst()).to.deep.equal(ast)
}

const $R = ast.Module('$R')
$R.declaration = true
$R.src = getLoc('$R', Pos(1, 16))
$R.ports.push(ast.Port(makeIdent('A', Pos(1, 27)), 'analog'))
$R.ports.push(ast.Port(makeIdent('B', Pos(1, 37)), 'analog'))

function expectAstModule(text: string, stmts: ast.Stmt[]) {
    const design = ast.Design()
    design.modules.push($R)
    design.modules.push(ast.Module('A', stmts, getLoc('A', Pos(2, 8))))
    expectAst(`declare module $R {analog A; analog B}\nmodule A {\n${text}\n}`, design)
}

function expectAstExpr(text: string, e: ast.Expr) {
    expectAstModule('a = \n' + text, [ ast.Assign(makeIdent('a', Pos(3, 1)), e) ])
}

describe('Elaborator', () => {
    /*it('should elaborate imports', () => {
        const design = ast.Design()

        design.imports.push(ast.Import([
            makeIdent('a', 8),
            makeIdent('b', 11)
        ], 'package', getLoc('"package"', 18)))
        expectAst('import a, b from "package"', design)
        design.imports.pop()

        design.imports.push(ast.Import([
            makeIdent('a', 8)
        ], './file', getLoc('"./file"', 15)))
    })*/

    it('should elaborate modules', () => {
        const design = ast.Design()

        design.modules.push(ast.Module('A', [], getLoc('A', Pos(1, 8))))
        expectAst('module A {}', design)
        design.modules.pop()

        design.modules.push(ast.Module('A', [], getLoc('A', Pos(1, 15))))
        design.modules[0].exported = true
        expectAst('export module A {}', design)
        design.modules.pop()

        design.modules.push(ast.Module('A', [], getLoc('A', Pos(1, 16))))
        design.modules[0].declaration = true
        expectAst('declare module A {}', design)
        design.modules.pop()

        design.modules.push(ast.Module('A', [], getLoc('A', Pos(1, 28))))
        design.modules[0].attrs.push(
            ast.Attr(ast.Ident('bom', getLoc('@bom', Pos(1, 1))), [
                ast.Param(0, makeString('Yago', Pos(1, 6))),
                ast.Param(1, makeString('XYZ', Pos(1, 14))),
        ]))
        expectAst('@bom("Yago", "XYZ") module A {}', design)
        design.modules.pop()

        design.modules.push(ast.Module('A', [], getLoc('A', Pos(1, 8))))
        design.modules[0].params.push(
            ast.ParamDecl(makeIdent('R', Pos(1, 10)),
                          makeIdent('Ohm', Pos(1, 13))))
        expectAst('module A(R: Ohm) {}', design)
        design.modules.pop()
    })

    describe('should elaborate statements', () => {
        it('should elaborate declarations', () => {
            expectAstModule('net a', [ast.Net(makeIdent('a', Pos(3, 5)))])

            expectAstModule('net[2] a', [
                ast.Net(makeIdent('a', Pos(3, 8)), makeInteger(2, Pos(3, 5)))
            ])

            expectAstModule('net a, b', [
                ast.Net(makeIdent('a', Pos(3, 5))),
                ast.Net(makeIdent('b', Pos(3, 8)))
            ])

            expectAstModule('net a = c', [
                ast.Net(makeIdent('a', Pos(3, 5))),
                ast.Assign(makeIdent('a', Pos(3, 5)),
                           makeIdent('c', Pos(3, 9)))
            ])

            expectAstModule('net a, b = c, d', [
                ast.Net(makeIdent('a', Pos(3, 5))),
                ast.Net(makeIdent('b', Pos(3, 8))),
                ast.Assign(makeIdent('a', Pos(3, 5)),
                           makeIdent('c', Pos(3, 12))),
                ast.Assign(makeIdent('b', Pos(3, 8)),
                           makeIdent('d', Pos(3, 15)))
            ])

            expectAstModule('net a, b = c[0], d[1]', [
                ast.Net(makeIdent('a', Pos(3, 5))),
                ast.Net(makeIdent('b', Pos(3, 8))),
                ast.Assign(makeIdent('a', Pos(3, 5)),
                           ast.Ref(makeIdent('c', Pos(3, 12)),
                                   makeInteger(0, Pos(3, 14)),
                                   makeInteger(0, Pos(3, 14)),
                                   getLoc('c[0]', Pos(3, 12)))),
                ast.Assign(makeIdent('b', Pos(3, 8)),
                           ast.Ref(makeIdent('d', Pos(3, 18)),
                                   makeInteger(1, Pos(3, 20)),
                                   makeInteger(1, Pos(3, 20)),
                                   getLoc('d[1]', Pos(3, 18))))

            ])
        })

        it('should elaborate to SetAttributes', () => {
            const widthAttr = ast.Attr(
                ast.Ident('rotate', getLoc('@rotate', Pos(3, 1))), [
                    ast.Param(0, makeInteger(90, Pos(3, 9)))
                ])

            const cells = [
                ast.Cell(makeIdent('a', Pos(3, 18))),
                ast.Cell(makeIdent('b', Pos(3, 21)))
            ]
            cells[0].attrs.push(widthAttr)
            cells[1].attrs.push(widthAttr)
            expectAstModule('@rotate(90) cell a, b', cells)

            /*setattr.fqns.push(ast.FQN([
                makeIdent('a', 12 + 10),
                makeIdent('b', 14 + 10),
                makeIdent('c', 16 + 10)
            ]))*/
            //expectAstModule("@width(10) a.b.c", [setattr])
        })
    })

    describe('should elaborate to expressions', () => {
        describe('should elaborate literals', () => {
            it('should elaborate Integer', () => {
                expectAstExpr('0', makeInteger(0, Pos(4, 1)))
            })

            it('should elaborate BitVector', () => {
                expectAstExpr("4'01xz", ast.BitVector(['0', '1', 'x', 'z'],
                                                      getLoc("4'01xz", Pos(4, 1))))
            })

            it('should elaborate Unit', () => {
                expectAstExpr('10k', ast.Unit(10, 3, '', getLoc('10k', Pos(4, 1))))

                expectAstExpr('2.2k', ast.Unit(2.2, 3, '', getLoc('2.2k', Pos(4, 1))))
            })

            it('should elaborate String', () => {
                expectAstExpr('"string"', makeString('string', Pos(4, 1)))
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

        describe('should elaborate binops', () => {
            it('should elaborate Add', () => {
                expectAstExpr('1 + 1', ast.BinOp('+', makeInteger(1, Pos(4, 1)),
                                                 makeInteger(1, Pos(4, 5))))
            })

            it('should elaborate Sub', () => {
                expectAstExpr('1 - 1', ast.BinOp('-', makeInteger(1, Pos(4, 1)),
                                                 makeInteger(1, Pos(4, 5))))
            })

            it('should elaborate Mul', () => {
                expectAstExpr('1 * 1', ast.BinOp('*', makeInteger(1, Pos(4, 1)),
                                                 makeInteger(1, Pos(4, 5))))
            })

            it('should elaborate Shl', () => {
                expectAstExpr('1 << 1', ast.BinOp('<<', makeInteger(1, Pos(4, 1)),
                                                  makeInteger(1, Pos(4, 6))))
            })

            it('should elaborate Shr', () => {
                expectAstExpr('1 >> 1', ast.BinOp('>>', makeInteger(1, Pos(4, 1)),
                                                  makeInteger(1, Pos(4, 6))))
            })
        })

        it('should elaborate Tuple', () => {
            expectAstExpr('(a, b, c)', ast.Tuple([
                makeIdent('a', Pos(4, 2)),
                makeIdent('b', Pos(4, 5)),
                makeIdent('c', Pos(4, 8)),
            ], getLoc('(a, b, c)', Pos(4, 1))))
        })

        it('should elaborate Identifier', () => {
            expectAstExpr('helloThere', makeIdent('helloThere', Pos(4, 1)))
            expectAstExpr("'+3.3V", makeIdent("'+3.3V", Pos(4, 1)))
        })

        it('should elaborate Ref', () => {
            expectAstExpr('a[2:3]', ast.Ref(makeIdent('a', Pos(4, 1)),
                                            makeInteger(2, Pos(4, 3)),
                                            makeInteger(3, Pos(4, 5)),
                                            getLoc('a[2:3]', Pos(4, 1))))

            expectAstExpr('a[2]', ast.Ref(makeIdent('a', Pos(4, 1)),
                                          makeInteger(2, Pos(4, 3)),
                                          makeInteger(2, Pos(4, 3)),
                                          getLoc('a[2]', Pos(4, 1))))
        })

        it('should elaborate AnonymousCell', () => {
            const mod = ast.Module('', [
                ast.Port(makeIdent('A', Pos(4, 17)), 'input',
                         makeInteger(1, Pos(4, 14))),
                ast.Port(makeIdent('Y', Pos(4, 32)), 'output',
                         makeInteger(1, Pos(4, 29))),
            ])
            mod.declaration = true
            mod.src = getLoc('cell', Pos(4, 1))
            const dict = ast.Dict()
            dict.entries.push(ast.DictEntry(makeIdent('A', Pos(4, 17)),
                                            makeIdent('a', Pos(4, 19))))
            dict.entries.push(ast.DictEntry(makeIdent('Y', Pos(4, 32)),
                                            makeIdent('y', Pos(4, 34))))
            expectAstExpr('cell { input[1] A=a; output[1] Y=y}',
                          ast.ModInst(mod, [], dict, mod.src))
        })

        it('should elaborate ModInst', () => {
            const dict = ast.Dict()
            const inst = ast.ModInst($R, [], dict,
                                     getLoc('$R', Pos(4, 1)))

            dict.src = getLoc('{}', Pos(4, 6)) || emptySrcLoc
            expectAstExpr('$R() {}', inst)

            dict.src = getLoc('{}', Pos(4, 6)) || emptySrcLoc
            expectAstExpr('$R() {}', inst)

            inst.params.push(ast.Param(0, ast.Unit(10, 3, '',
                                                   getLoc('10k', Pos(4, 4)))))
            dict.src = getLoc('{}', Pos(4, 9)) || emptySrcLoc
            expectAstExpr('$R(10k) {}', inst)
            inst.params.pop()

            dict.entries.push(ast.DictEntry(makeIdent('A', Pos(4, 5)),
                                            makeIdent('A', Pos(4, 5))))
            dict.src = getLoc('{A}', Pos(4, 4)) || emptySrcLoc
            expectAstExpr('$R {A}', inst)

            dict.entries.push(ast.DictEntry(makeIdent('B', Pos(4, 8)),
                                            makeIdent('B', Pos(4, 10))))
            dict.src = getLoc('{A, B=B}', Pos(4, 4)) || emptySrcLoc
            expectAstExpr('$R {A, B=B}', inst)

            dict.src = getLoc('{A, *}', Pos(4, 4))
            inst.dict.star = true
            inst.dict.starSrc = getLoc('*', Pos(4, 8))
            inst.dict.entries[1].ident.src = inst.dict.starSrc
            inst.dict.entries[1].expr.src = inst.dict.starSrc
            expectAstExpr('$R {A, *}', inst)

            dict.src = getLoc('{*}', Pos(4, 4))
            inst.dict.star = true
            inst.dict.starSrc = getLoc('*', Pos(4, 5))
            inst.dict.entries[0].ident.src = inst.dict.starSrc
            inst.dict.entries[0].expr.src = inst.dict.starSrc
            inst.dict.entries[1].ident.src = inst.dict.starSrc
            inst.dict.entries[1].expr.src = inst.dict.starSrc
            expectAstExpr('$R {*}', inst)

        })
    })
})
