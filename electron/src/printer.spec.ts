import {expect} from 'chai'
import { IAstImport, IAstDeclStmt, IAstLiteral, IAstIdentifier,
         Ast, AstDeclType, AstLiteralType,
         IAstAttribute, AstExpr,
    IAstAssignStmt,
    IAstParam,
    IAstReference,
    IAstParamDecl} from './ast'
import {render, IDoc, emitDesign, emitImport, emitModule,
        emitStatement, emitExpression, emitAttribute} from './printer'

function expectPretty(doc: IDoc, text: string) {
    expect(render(80, doc)).to.deep.equal(text);
}

function makeIdent(name: string): IAstIdentifier {
    return {
        ast: Ast.Identifier,
        id: name,
    }
}

function makeInteger(int: number): IAstLiteral {
    return {
        ast: Ast.Literal,
        value: int.toString(),
        litType: AstLiteralType.Integer,
    }
}

function makeString(str: string): IAstLiteral {
    return {
        ast: Ast.Literal,
        value: '"' + str + '"',
        litType: AstLiteralType.String,
    }
}

function makeDecl(declType: AstDeclType, width: number,
                  name: string): IAstDeclStmt {
    return {
        ast: Ast.Decl,
        attributes: [],
        declType,
        width: makeInteger(width),
        identifier: makeIdent(name),
    }
}

function makeAssign(lhs: AstExpr, rhs: AstExpr): IAstAssignStmt {
    return {
        ast: Ast.Assign,
        rhs,
        lhs
    }
}

function makeAttr(name: string, params: IAstParam[]): IAstAttribute {
    return {
        ast: Ast.Attribute,
        name: makeIdent(name),
        parameters: params,
    }
}

function makeParam(name: null | string, value: AstExpr): IAstParam {
    return {
        ast: Ast.Param,
        name: name ? makeIdent(name) : null,
        value,
    }
}

function makeParamDecl(name: string, ty: string): IAstParamDecl {
    return {
        ast: Ast.ParamDecl,
        name: makeIdent(name),
        ty: makeIdent(ty),
    }
}

function makeRef(name: string, _from: number, to: number): IAstReference {
    return {
        ast: Ast.Ref,
        identifier: makeIdent(name),
        from: makeInteger(_from),
        to: makeInteger(to),
    }
}

function makeImport(ids: string[], pkg: string): IAstImport {
    return {
        ast: Ast.Import,
        identifiers: ids.map(makeIdent),
        package: pkg,
    }
}

describe('Pretty Printer', () => {
    it('should emit attributes', () => {
        const bomAttr = makeAttr('bom', [
            makeParam(null, makeString('Yago')),
            makeParam(null, makeString('XYZ'))
        ])

        expectPretty(
            emitAttribute(makeAttr('model', [
                makeParam(null, makeIdent('A'))
            ])), '@model(A)\n')

        expectPretty(
            emitAttribute(makeAttr('parameter', [
                makeParam('A_WIDTH', makeInteger(1))
            ])),
            '@parameter(A_WIDTH=1)\n')

        expectPretty(emitModule({
            ast: Ast.Module,
            attributes: [bomAttr],
            exported: false,
            declaration: false,
            identifier: makeIdent('mod'),
            parameters: [],
            statements: [],
        }), '@bom("Yago", "XYZ")\nmodule mod {}\n')

        expectPretty(emitModule({
            ast: Ast.Module,
            attributes: [],
            exported: false,
            declaration: false,
            identifier: makeIdent('mod'),
            parameters: [ makeParamDecl('R', 'Ohm') ],
            statements: [],
        }), 'module mod(R: Ohm) {}\n')

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
            expectPretty(emitExpression(makeRef('a', 2, 2)), 'a[2]')

            expectPretty(emitExpression(makeRef('a', 0, 1)), 'a[0:1]')
        })

        it('should emit concatenations', () => {
            expectPretty(emitExpression({
                ast: Ast.Tuple,
                expressions: [
                    { ast: Ast.Identifier, id: 'a' },
                    { ast: Ast.Identifier, id: 'b' },
                    { ast: Ast.Identifier, id: 'c' },
                ],
            }), '(a, b, c)')
        })

        it('should emit cells', () => {
            expectPretty(emitExpression({
                ast: Ast.ModInst,
                module: { ast: Ast.Identifier, id: '$R' },
                width: {
                    ast: Ast.Literal,
                    value: '2',
                    litType: AstLiteralType.Integer,
                },
                parameters: [
                    {
                        ast: Ast.Param,
                        name: null,
                        value: {
                            ast: Ast.Literal,
                            value: '10k',
                            litType: AstLiteralType.Unit,
                        }
                    }
                ],
                dict: {
                    ast: Ast.Dict,
                    entries: [
                        {
                            ast: Ast.DictEntry,
                            identifier: { ast: Ast.Identifier, id: 'A' },
                            expr: { ast: Ast.Identifier, id: 'a' },
                        }
                    ],
                    star: false,
                }
            }), "$R(10k)[2] {A=a}")

            expectPretty(emitExpression({
                ast: Ast.ModInst,
                module: { ast: Ast.Identifier, id: '$R' },
                parameters: [
                    {
                        ast: Ast.Param,
                        name: null,
                        value: {
                            ast: Ast.Literal,
                            value: '10k',
                            litType: AstLiteralType.Unit,
                        }
                    }
                ],
                width: {
                    ast: Ast.Literal,
                    value: '2',
                    litType: AstLiteralType.Integer,
                },
                dict: {
                    ast: Ast.Dict,
                    entries: [
                        {
                            ast: Ast.DictEntry,
                            identifier: { ast: Ast.Identifier, id: 'A' },
                            expr: { ast: Ast.Identifier, id: 'a' },
                        },
                        {
                            ast: Ast.DictEntry,
                            identifier: { ast: Ast.Identifier, id: 'B' },
                            expr: { ast: Ast.Identifier, id: 'b' },
                        }
                    ],
                    star: false,
                }
            }), "$R(10k)[2] {A=a, B=b}")
        })
    })

    describe('should emit statements', () => {

        it('should emit declaration', () => {
            expectPretty(emitStatement(
                makeDecl(AstDeclType.Input, 1, 'a')), 'input a')

            expectPretty(emitStatement(
                makeDecl(AstDeclType.Inout, 1, 'a')), 'inout a')

            expectPretty(emitStatement(
                makeDecl(AstDeclType.Output, 1, 'a')), 'output a')

            expectPretty(emitStatement(
                makeDecl(AstDeclType.Net, 1, 'a')), 'net a')

            expectPretty(emitStatement(
                makeDecl(AstDeclType.Cell, 2, 'a')), 'cell[2] a')
        })

        it('should emit assignments', () => {
            expectPretty(emitStatement({
                ast: Ast.Assign,
                lhs: { ast: Ast.Identifier, id: 'a' },
                rhs: { ast: Ast.Identifier, id: 'b' },
            }), 'a = b')

            expectPretty(
                emitStatement(makeAssign(makeIdent('a'), makeRef('b', 0, 0))),
                'a = b[0]')
        })

        /*it('should emit fully qualified names', () => {
            expectPretty(emitStatement({
                attributes: [],
                fqn: [{id: 'a'}, {id: 'b'}, {id: 'c'}],
            }), 'a.b.c')
        })*/
    })

    it('should emit imports', () => {
        expectPretty(
            emitImport(makeImport(['a'], 'package')),
            'import a from "package"\n')
    })

    it('should emit modules', () => {
        expectPretty(emitModule({
            ast: Ast.Module,
            attributes: [],
            exported: false,
            declaration: false,
            identifier: makeIdent('mod'),
            parameters: [],
            statements: [ makeDecl(AstDeclType.Net, 1, 'a') ],
        }), 'module mod {\n  net a\n}\n')

        expectPretty(emitModule({
            ast: Ast.Module,
            attributes: [],
            exported: true,
            declaration: false,
            identifier: makeIdent('mod'),
            parameters: [],
            statements: [],
        }), 'export module mod {}\n')

        expectPretty(emitModule({
            ast: Ast.Module,
            attributes: [],
            exported: true,
            declaration: true,
            identifier: makeIdent('mod'),
            parameters: [],
            statements: [],
        }), 'export declare module mod {}\n')
    })

    it('should emit designs', () => {
        expectPretty(emitDesign({
            ast: Ast.Design,
            imports: [ makeImport(['a'], 'b') ],
            modules: [
                {
                    ast: Ast.Module,
                    attributes: [],
                    exported: false,
                    declaration: false,
                    identifier: makeIdent('mod'),
                    parameters: [],
                    statements: [],
                }
            ],
        }), 'import a from "b"\nmodule mod {}\n')
    })
})
