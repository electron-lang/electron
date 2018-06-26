import { expect } from 'chai'
import { parse } from './parser'
import { Elaborator } from './elaborator'
import * as ast from './ast'
import { DiagnosticCollector, ISrcLoc, emptySrcLoc } from './diagnostic';

function getLoc(text: string, offset?: number): ISrcLoc | undefined {
    if (offset) {
        return {
            startLine: 1,
            startColumn: offset,
            endLine: 1,
            endColumn: offset + text.length - 1,
        }
    }
}

function makeIdent(name: string, offset?: number): ast.IIdent {
    return ast.Ident(name, getLoc(name, offset))
}

function makeInteger(int: number, offset?: number): ast.IInteger {
    return ast.Integer(int, getLoc(int.toString(), offset))
}

function makeString(str: string, offset?: number): ast.IString {
    return ast.String(str, getLoc(`"${str}"`, offset))
}

function expectAst(text: string, ast: ast.IDesign) {
    const dc = new DiagnosticCollector()
    const el = new Elaborator(dc.toPublisher())
    const cst = parse(text)
    const ast2 = el.visit(cst)
    expect(dc.getDiagnostics().length).to.equal(0)
    expect(ast2).to.deep.equal(ast)
}

function expectAstModule(text: string, stmts: ast.Stmt[]) {
    const design = ast.Design()
    design.modules.push(ast.Module('A', stmts, getLoc('A', 8)))
    expectAst(`module A {${text}}`, design)
}

function expectAstExpr(text: string, e: ast.Expr) {
    expectAstModule('a = ' + text, [ ast.Assign(makeIdent('a', 1 + 10), e) ])
}

describe('Elaborator', () => {
    it('should elaborate imports', () => {
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
    })

    it('should elaborate modules', () => {
        const design = ast.Design()

        design.modules.push(ast.Module('A', [], getLoc('A', 8)))
        expectAst('module A {}', design)
        design.modules.pop()

        design.modules.push(ast.Module('A', [], getLoc('A', 15)))
        design.modules[0].exported = true
        expectAst('export module A {}', design)
        design.modules.pop()

        design.modules.push(ast.Module('A', [], getLoc('A', 16)))
        design.modules[0].declaration = true
        expectAst('declare module A {}', design)
        design.modules.pop()

        design.modules.push(ast.Module('A', [], getLoc('A', 28)))
        design.modules[0].attrs.push(ast.Attr(ast.Ident('bom', getLoc('@bom', 1)), [
            ast.Param(0, makeString('Yago', 6)),
            ast.Param(1, makeString('XYZ', 14)),
        ]))
        expectAst('@bom("Yago", "XYZ") module A {}', design)
        design.modules.pop()

        design.modules.push(ast.Module('A', [], getLoc('A', 8)))
        design.modules[0].params.push(
            ast.ParamDecl(makeIdent('R', 10), makeIdent('Ohm', 13)))
        expectAst('module A(R: Ohm) {}', design)
        design.modules.pop()
    })

    describe('should elaborate statements', () => {
        it('should elaborate declarations', () => {
            expectAstModule('net a', [ast.Net(makeIdent('a', 5 + 10))])

            expectAstModule('net[2] a', [
                ast.Net(makeIdent('a', 8 + 10), makeInteger(2, 5 + 10))
            ])

            expectAstModule('net a, b', [
                ast.Net(makeIdent('a', 5 + 10)),
                ast.Net(makeIdent('b', 8 + 10))
            ])

            expectAstModule('net a = c', [
                ast.Net(makeIdent('a', 5 + 10)),
                ast.Assign(makeIdent('a', 5 + 10),
                           makeIdent('c', 9 + 10))
            ])

            expectAstModule('net a, b = c, d', [
                ast.Net(makeIdent('a', 5 + 10)),
                ast.Net(makeIdent('b', 8 + 10)),
                ast.Assign(makeIdent('a', 5 + 10),
                           makeIdent('c', 12 + 10)),
                ast.Assign(makeIdent('b', 8 + 10),
                           makeIdent('d', 15 + 10))
            ])

            expectAstModule('net a, b = c[0], d[1]', [
                ast.Net(makeIdent('a', 5 + 10)),
                ast.Net(makeIdent('b', 8 + 10)),
                ast.Assign(makeIdent('a', 5 + 10),
                           ast.Ref(makeIdent('c', 12 + 10),
                                   makeInteger(0, 14 + 10),
                                   makeInteger(0, 14 + 10),
                                   getLoc('c[0]', 12 + 10))),
                ast.Assign(makeIdent('b', 8 + 10),
                           ast.Ref(makeIdent('d', 18 + 10),
                                   makeInteger(1, 20 + 10),
                                   makeInteger(1, 20 + 10),
                                   getLoc('d[1]', 18 + 10)))

            ])
        })

        it('should elaborate to SetAttributes', () => {
            const widthAttr = ast.Attr(ast.Ident('width',
                                                 getLoc('@width', 1 + 10)),
                                       [ ast.Param(0, makeInteger(10, 8 + 10)) ])

            const setattr = ast.SetAttr([widthAttr])
            setattr.stmts.push(ast.Net(makeIdent('a', 16 + 10)),
                               ast.Net(makeIdent('b', 19 + 10)))
            expectAstModule('@width(10) net a, b', [setattr])
            setattr.stmts = []

            setattr.fqns.push(ast.FQN([
                makeIdent('a', 12 + 10),
                makeIdent('b', 14 + 10),
                makeIdent('c', 16 + 10)
            ]))
            expectAstModule("@width(10) a.b.c", [setattr])
        })
    })

    describe('should elaborate to expressions', () => {
        describe('should elaborate literals', () => {
            it('should elaborate Integer', () => {
                expectAstExpr('0', makeInteger(0, 1 + 14))
            })

            it('should elaborate BitVector', () => {
                expectAstExpr("4'01xz", ast.BitVector(['0', '1', 'x', 'z'],
                                                      getLoc("4'01xz", 1 + 14)))
            })

            it('should elaborate Unit', () => {
                expectAstExpr('10k', ast.Unit(10, 3, '', getLoc('10k', 1 + 14)))

                expectAstExpr('2.2k', ast.Unit(2.2, 3, '', getLoc('2.2k', 1 + 14)))
            })

            it('should elaborate String', () => {
                expectAstExpr('"string"', makeString('string', 1 + 14))
            })

            it('should elaborate Real', () => {
                expectAstExpr('1.26e-12', ast.Real(1.26e-12,
                                                   getLoc('1.26e-12', 1 + 14)))
            })

            it('should elaborate Boolean', () => {
                expectAstExpr('true', ast.Bool(true, getLoc('true', 1 + 14)))
                expectAstExpr('false', ast.Bool(false, getLoc('false', 1 + 14)))
            })
        })

        describe('should elaborate binops', () => {
            it('should elaborate Add', () => {
                expectAstExpr('1 + 1', ast.BinOp('+', makeInteger(1, 1 + 14),
                                                 makeInteger(1, 5 + 14)))
            })

            it('should elaborate Sub', () => {
                expectAstExpr('1 - 1', ast.BinOp('-', makeInteger(1, 1 + 14),
                                                 makeInteger(1, 5 + 14)))
            })

            it('should elaborate Mul', () => {
                expectAstExpr('1 * 1', ast.BinOp('*', makeInteger(1, 1 + 14),
                                                 makeInteger(1, 5 + 14)))
            })

            it('should elaborate Shl', () => {
                expectAstExpr('1 << 1', ast.BinOp('<<', makeInteger(1, 1 + 14),
                                                 makeInteger(1, 6 + 14)))
            })

            it('should elaborate Shr', () => {
                expectAstExpr('1 >> 1', ast.BinOp('>>', makeInteger(1, 1 + 14),
                                                 makeInteger(1, 6 + 14)))
            })
        })

        it('should elaborate Tuple', () => {
            expectAstExpr('(a, b, c)', ast.Tuple([
                makeIdent('a', 2 + 14),
                makeIdent('b', 5 + 14),
                makeIdent('c', 8 + 14),
            ], getLoc('(a, b, c)', 1 + 14)))
        })

        it('should elaborate Identifier', () => {
            expectAstExpr('helloThere', makeIdent('helloThere', 1 + 14))
            expectAstExpr("'+3.3V", makeIdent("'+3.3V", 1 + 14))
        })

        it('should elaborate Ref', () => {
            expectAstExpr('a[2:3]', ast.Ref(makeIdent('a', 1 + 14),
                                            makeInteger(2, 3 + 14),
                                            makeInteger(3, 5 + 14),
                                            getLoc('a[2:3]', 1 + 14)))

            expectAstExpr('a[2]', ast.Ref(makeIdent('a', 1 + 14),
                                          makeInteger(2, 3 + 14),
                                          makeInteger(2, 3 + 14),
                                          getLoc('a[2]', 1 + 14)))
        })

        it('should elaborate AnonymousMod', () => {
            expectAstExpr('module { input[1] a; output[1] y}',
                          ast.AnonMod([
                              ast.Port(makeIdent('a', 19 + 14), 'input',
                                       makeInteger(1, 16 + 14)),
                              ast.Port(makeIdent('y', 32 + 14), 'output',
                                       makeInteger(1, 29 + 14)),
                          ]))
        })

        it('should elaborate ModInst', () => {
            const dict = ast.Dict(false)
            const inst = ast.ModInst('$R', [], dict, getLoc('$R', 1 + 14))


            dict.src = getLoc('{}', 6 + 14) || emptySrcLoc
            expectAstExpr('$R() {}', inst)

            dict.src = getLoc('{}', 6 + 14) || emptySrcLoc
            expectAstExpr('$R() {}', inst)

            inst.params.push(ast.Param(0, ast.Unit(10, 3, '',
                                                   getLoc('10k', 4 + 14))))
            dict.src = getLoc('{}', 9 + 14) || emptySrcLoc
            expectAstExpr('$R(10k) {}', inst)
            inst.params.pop()

            dict.entries.push(ast.DictEntry(makeIdent('A', 7 + 14),
                                            makeIdent('A', 7 + 14)))
            dict.src = getLoc('{A}', 6 + 14) || emptySrcLoc
            expectAstExpr('$R() {A}', inst)

            dict.entries.push(ast.DictEntry(makeIdent('B', 10 + 14),
                                            makeIdent('b', 12 + 14)))
            dict.src = getLoc('{A, B=b}', 6 + 14) || emptySrcLoc
            expectAstExpr('$R() {A, B=b}', inst)
        })
    })
})
