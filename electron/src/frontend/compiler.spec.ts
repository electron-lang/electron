import { expect } from 'chai'
import * as ast from './ast'
import * as ir from '../backend/ir'
import { ASTCompiler } from './compiler'
import { printIR } from '../backend/printer'
import { DiagnosticCollector, Logger, SrcLoc } from '../diagnostic'

function transformSigs(mod1: ir.IModule, mod2: ir.IModule) {
    for (let p1 of mod1.ports) {
        for (let p2 of mod2.ports) {
            if (p1.name === p2.name) {
                for (let i = 0; i < p1.value.length; i++) {
                    // since it's a graph changing the sig value
                    // should preserve it's structure
                    if (typeof p1.value[i].value === 'number' &&
                        typeof p2.value[i].value === 'number') {
                        p2.value[i].value = p1.value[i].value
                    }
                }
            }
        }
    }
    for (let p1 of mod1.nets) {
        for (let p2 of mod2.nets) {
            if (p1.name === p2.name) {
                for (let i = 0; i < p1.value.length; i++) {
                    // since it's a graph changing the sig value
                    // should preserve it's structure
                    if (typeof p1.value[i].value === 'number' &&
                        typeof p2.value[i].value === 'number') {
                        p2.value[i].value = p1.value[i].value
                    }
                }
            }
        }
    }
    for (let p1 of mod1.cells) {
        for (let p2 of mod2.cells) {
            if (p1.name === p2.name) {
                for (let a1 of p1.assigns) {
                    for (let a2 of p2.assigns) {
                        if (a1.lhs.ref.name === a2.lhs.ref.name) {
                            for (let i = 0; i < a1.lhs.ref.value.length; i++) {
                                // since it's a graph changing the sig value
                                // should preserve it's structure
                                if (typeof a1.lhs.ref.value[i].value === 'number' &&
                                    typeof a2.lhs.ref.value[i].value === 'number') {
                                    a2.lhs.ref.value[i].value = a1.lhs.ref.value[i].value
                                }
                            }
                            for (let i = 0; i < a1.rhs.length; i++) {
                                // since it's a graph changing the sig value
                                // should preserve it's structure
                                if (typeof a1.rhs[i].value === 'number' &&
                                    typeof a2.rhs[i].value === 'number') {
                                    a2.rhs[i].value = a1.rhs[i].value
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

type equalType = {equal: (ir: ir.IModule) => void}
type expectIRType = {to: equalType, with: (params: ir.IParam[]) => {to: equalType}}

const file = 'compiler.spec.ts'
const dc = new DiagnosticCollector()
const comp = new ASTCompiler({
    crate: '',
    file: file,
    manglingPrefix: '',
    logger: new Logger(dc)
})

function expectIR(ast: ast.IModule): expectIRType {
    const equal = (params: ir.IParam[]) => {
        return {
            equal: (ir: ir.IModule) => {
                const irmod = comp.compileModule(ast, params)
                for (let d of dc.getDiagnostics()) {
                    console.log(d.message)
                }
                try {
                    transformSigs(ir, irmod)
                    expect(irmod).to.deep.equal(ir)
                } catch(e) {
                    console.log(printIR(irmod))
                    throw e
                }
            }
        }
    }
    return {
        with: (params: ir.IParam[]) => {
            return {
                to: equal(params)
            }
        },
        to: equal([])
    }
}

describe('AST Compiler', () => {
    it('should compile an empty module', () => {
        expectIR(ast.Module('MODULE', [], new SrcLoc(file, [2, 4, 2, 10])))
            .to.equal(ir.Module('MODULE', [], new SrcLoc(file, [2, 4, 2, 10])))
    })

    it('should compile a module with a cell', () => {
        const $R = ast.Module('$R', [
            ast.Param('RES', 'Ohm'),
            ast.Port('A', 'analog'),
            ast.Port('B', 'analog'),
        ])
        $R.declaration = true

        const a = ast.Port('a', 'analog')
        const b = ast.Port('b', 'analog')
        const inst = ast.Inst(ast.Ref($R), [
            [ast.Ref($R.params[0]), ast.Unit('10k')]
        ], [
            [ast.Ref($R.ports[0]), ast.Ref(a)],
            [ast.Ref($R.ports[1]), ast.Ref(b)],
        ])
        const r1 = ast.Cell('r1')
        const R = ast.Module('R', [ a, b, r1, ast.Assign(ast.Ref(r1), inst) ])

        const i$R = ir.Module('$R', [])
        i$R.ports = [
            ir.Port('A', 'analog', [ ir.Sig.create() ], []),
            ir.Port('B', 'analog', [ ir.Sig.create() ], [])
        ]
        i$R.attrs.push(ir.Attr('declare', true))
        const iR = ir.Module('R', [])
        const sa = ir.Sig.create()
        const sb = ir.Sig.create()
        const ia = ir.Port('a', 'analog', [sa], [])
        const ib = ir.Port('b', 'analog', [sb], [])
        const ir1 = ir.Cell('r1', i$R, [ir.Param('RES', 10e3)], [
            ir.Assign(ir.Ref(i$R.ports[0], 0), [sa]),
            ir.Assign(ir.Ref(i$R.ports[1], 0), [sb]),
        ], [])
        iR.ports = [ia, ib]
        iR.cells = [ir1]
        expectIR(R).to.equal(iR)
    })

    it('should compile signal vectors', () => {
        const A_WIDTH = ast.Param('A_WIDTH', 'Integer')
        const B_WIDTH = ast.Param('B_WIDTH', 'Integer')
        const $and = ast.Module('$and', [
            A_WIDTH, B_WIDTH,
            ast.Port('A', 'input', ast.Ref(A_WIDTH)),
            ast.Port('B', 'input', ast.Ref(B_WIDTH)),
            ast.Port('Y', 'output'),
        ])
        $and.declaration = true

        const a = ast.Port('a', 'input', ast.Integer(2))
        const b = ast.Port('b', 'input', ast.Integer(3))
        const y = ast.Port('y', 'output')
        const inst = ast.Inst(ast.Ref($and), [
            [ast.Ref(A_WIDTH), ast.Integer(2)],
            [ast.Ref(B_WIDTH), ast.Integer(3)]
        ], [
            [ast.Ref($and.ports[0]), ast.Ref(a)],
            [ast.Ref($and.ports[1]), ast.Ref(b)],
            [ast.Ref($and.ports[2]), ast.Ref(y)],
        ])
        const and1 = ast.Cell('and1')
        const AND = ast.Module('AND', [
            a, b, y, and1,
            ast.Assign(ast.Ref(and1), inst)
        ])

        const i$and = ir.Module('$and', [])
        i$and.ports = [
            ir.Port('A', 'input', [ ir.Sig.create(), ir.Sig.create() ], []),
            ir.Port('B', 'input', [ ir.Sig.create(), ir.Sig.create(), ir.Sig.create() ], []),
            ir.Port('Y', 'output', [ ir.Sig.create() ], []),
        ]
        i$and.attrs.push(ir.Attr('declare', true))
        const iAND = ir.Module('AND', [])
        const sa = [ ir.Sig.create(), ir.Sig.create() ]
        const sb = [ ir.Sig.create(), ir.Sig.create(), ir.Sig.create() ]
        const sy = [ ir.Sig.create() ]
        const ia = ir.Port('a', 'input', sa, [])
        const ib = ir.Port('b', 'input', sb, [])
        const iy = ir.Port('y', 'output', sy, [])
        const iand1 = ir.Cell('and1', i$and, [
            ir.Param('A_WIDTH', 2),
            ir.Param('B_WIDTH', 3),
        ], [
            ir.Assign(ir.Ref(i$and.ports[0], 0), sa),
            ir.Assign(ir.Ref(i$and.ports[1], 0), sb),
            ir.Assign(ir.Ref(i$and.ports[2], 0), sy),
        ], [])
        iAND.ports = [ia, ib, iy]
        iAND.cells = [iand1]
        expectIR(AND).to.equal(iAND)
    })

    it('should compile cell vectors', () => {
        const $R = ast.Module('$R', [
            ast.Param('RES', 'Ohm'),
            ast.Port('A', 'analog'),
            ast.Port('B', 'analog'),
        ])
        $R.declaration = true

        const a = ast.Port('a', 'analog', ast.Integer(2))
        const b = ast.Port('b', 'analog', ast.Integer(2))

        const r1inst = ast.Inst(ast.Ref($R), [
            [ast.Ref($R.params[0]), ast.Unit('10k')]
        ], [
            [ast.Ref($R.ports[0]), ast.Range(ast.Ref(a), ast.Integer(0))],
            [ast.Ref($R.ports[1]), ast.Range(ast.Ref(b), ast.Integer(0))],
        ])

        const r2inst = ast.Inst(ast.Ref($R), [
            [ast.Ref($R.params[0]), ast.Unit('10k')]
        ], [
            [ast.Ref($R.ports[0]), ast.Range(ast.Ref(a), ast.Integer(1))],
            [ast.Ref($R.ports[1]), ast.Range(ast.Ref(b), ast.Integer(1))],
        ])

        const rx = ast.Cell('rx', ast.Integer(2))
        const ResArray = ast.Module('ResArray', [
            a, b, rx,
            ast.Assign(ast.Range(ast.Ref(rx), ast.Integer(0)), r1inst),
            ast.Assign(ast.Range(ast.Ref(rx), ast.Integer(1)), r2inst),
        ])

        const i$R = ir.Module('$R', [])
        i$R.ports = [
            ir.Port('A', 'analog', [ ir.Sig.create() ], []),
            ir.Port('B', 'analog', [ ir.Sig.create() ], [])
        ]
        i$R.attrs.push(ir.Attr('declare', true))

        const iResArray = ir.Module('ResArray', [])
        const sa = [ ir.Sig.create(), ir.Sig.create() ]
        const sb = [ ir.Sig.create(), ir.Sig.create() ]
        const ia = ir.Port('a', 'analog', sa, [])
        const ib = ir.Port('b', 'analog', sb, [])
        const ir1 = ir.Cell('rx$0', i$R, [
            ir.Param('RES', 10e3),
        ], [
            ir.Assign(ir.Ref(i$R.ports[0], 0), [ sa[0] ]),
            ir.Assign(ir.Ref(i$R.ports[1], 0), [ sb[0] ]),
        ], [])
        const ir2 = ir.Cell('rx$1', i$R, [
            ir.Param('RES', 10e3),
        ], [
            ir.Assign(ir.Ref(i$R.ports[0], 0), [ sa[1] ]),
            ir.Assign(ir.Ref(i$R.ports[1], 0), [ sb[1] ]),
        ], [])
        iResArray.ports = [ia, ib]
        iResArray.cells = [ir1, ir2]
        expectIR(ResArray).to.equal(iResArray)
    })

    it('should compile const expressions', () => {
        const A_WIDTH = ast.Param('A_WIDTH', 'Integer')
        const B_WIDTH = ast.Param('B_WIDTH', 'Integer')
        const $and = ast.Module('$and', [
            A_WIDTH, B_WIDTH,
            ast.Port('A', 'input', ast.Ref(A_WIDTH)),
            ast.Port('B', 'input', ast.Ref(B_WIDTH)),
            ast.Port('Y', 'output'),
        ])
        $and.declaration = true

        const WIDTH = ast.Param('WIDTH', 'Integer')
        const AND_WIDTH = ast.Const('AND_WIDTH')
        const a = ast.Port('a', 'input', ast.Ref(AND_WIDTH))
        const b = ast.Port('b', 'input', ast.Ref(AND_WIDTH))
        const y = ast.Port('y', 'output')
        const inst = ast.Inst(ast.Ref($and), [
            [ast.Ref(A_WIDTH), ast.Ref(AND_WIDTH)],
            [ast.Ref(B_WIDTH), ast.Ref(AND_WIDTH)]
        ], [
            [ast.Ref($and.ports[0]), ast.Ref(a)],
            [ast.Ref($and.ports[1]), ast.Ref(b)],
            [ast.Ref($and.ports[2]), ast.Ref(y)],
        ])
        const and1 = ast.Cell('and1')
        const AND = ast.Module('AND', [
            WIDTH, AND_WIDTH,
            ast.Assign(ast.Ref(AND_WIDTH), ast.BinOp('+', ast.Ref(WIDTH),
                                                     ast.Integer(1))),
            a, b, y, and1,
            ast.Assign(ast.Ref(and1), inst),
        ])

        const i$and = ir.Module('$and', [])
        i$and.ports = [
            ir.Port('A', 'input', [ ir.Sig.create(), ir.Sig.create(), ir.Sig.create() ], []),
            ir.Port('B', 'input', [ ir.Sig.create(), ir.Sig.create(), ir.Sig.create() ], []),
            ir.Port('Y', 'output', [ ir.Sig.create() ], []),
        ]
        i$and.attrs.push(ir.Attr('declare', true))

        const iAND = ir.Module('AND', [])
        const sa = [ ir.Sig.create(), ir.Sig.create(), ir.Sig.create() ]
        const sb = [ ir.Sig.create(), ir.Sig.create(), ir.Sig.create() ]
        const sy = [ ir.Sig.create() ]
        const ia = ir.Port('a', 'input', sa, [])
        const ib = ir.Port('b', 'input', sb, [])
        const iy = ir.Port('y', 'output', sy, [])
        const iand1 = ir.Cell('and1', i$and, [
            ir.Param('A_WIDTH', 3),
            ir.Param('B_WIDTH', 3),
        ], [
            ir.Assign(ir.Ref(i$and.ports[0], 0), sa),
            ir.Assign(ir.Ref(i$and.ports[1], 0), sb),
            ir.Assign(ir.Ref(i$and.ports[2], 0), sy),
        ], [])
        iAND.ports = [ia, ib, iy]
        iAND.cells = [iand1]
        expectIR(AND).with([ir.Param('WIDTH', 2)]).to.equal(iAND)
    })
})
