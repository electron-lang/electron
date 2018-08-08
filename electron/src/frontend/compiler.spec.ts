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

function expectIR(ast: ast.IModule): expectIRType {
    const comp = new ASTCompiler({
        crate: '',
        file: file,
        manglingPrefix: '',
        logger: new Logger(dc)
    })
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
        const irmod = new ir.Module('MODULE', new SrcLoc(file, [2, 4, 2, 10]))
        irmod.addAttr(new ir.Attr('name', 'MODULE'))
        expectIR(ast.Module('MODULE', [], new SrcLoc(file, [2, 4, 2, 10])))
            .to.equal(irmod)
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

        const i$R = new ir.Module('$R')
        i$R.addAttr(new ir.Attr('name', '$R'))
        i$R.addAttr(new ir.Attr('declare', true))
        i$R.addPort(new ir.Port('A', 'analog'))
        i$R.addPort(new ir.Port('B', 'analog'))

        const iR = new ir.Module('R')
        iR.addAttr(new ir.Attr('name', 'R'))
        iR.addPort(new ir.Port('a', 'analog'))
        iR.addPort(new ir.Port('b', 'analog'))

        const ir1 = new ir.Cell('r1', i$R)
        ir1.addParam(new ir.Param('RES', 10e3))
        ir1.addAssign(new ir.Assign(new ir.Ref(i$R.ports[0]), iR.ports[0].value))
        ir1.addAssign(new ir.Assign(new ir.Ref(i$R.ports[1]), iR.ports[1].value))
        iR.addCell(ir1)
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

        const i$and = new ir.Module('$and')
        i$and.addAttr(new ir.Attr('name', '$and'))
        i$and.addAttr(new ir.Attr('declare', true))
        i$and.addPort(new ir.Port('A', 'input', 2))
        i$and.addPort(new ir.Port('B', 'input', 3))
        i$and.addPort(new ir.Port('Y', 'output', 1))

        const iAND = new ir.Module('AND')
        iAND.addAttr(new ir.Attr('name', 'AND'))
        iAND.addPort(new ir.Port('a', 'input', 2))
        iAND.addPort(new ir.Port('b', 'input', 3))
        iAND.addPort(new ir.Port('y', 'output', 1))

        const iand1 = new ir.Cell('and1', i$and)
        iand1.addParam(new ir.Param('A_WIDTH', 2))
        iand1.addParam(new ir.Param('B_WIDTH', 3))
        iand1.addAssign(new ir.Assign(new ir.Ref(i$and.ports[0]),
                                      iAND.ports[0].value))
        iand1.addAssign(new ir.Assign(new ir.Ref(i$and.ports[1]),
                                      iAND.ports[1].value))
        iand1.addAssign(new ir.Assign(new ir.Ref(i$and.ports[2]),
                                      iAND.ports[2].value))
        iAND.addCell(iand1)

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

        const i$R = new ir.Module('$R')
        i$R.addAttr(new ir.Attr('name', '$R'))
        i$R.addAttr(new ir.Attr('declare', true))
        i$R.addPort(new ir.Port('A', 'analog'))
        i$R.addPort(new ir.Port('B', 'analog'))

        const iResArray = new ir.Module('ResArray')
        iResArray.addAttr(new ir.Attr('name', 'ResArray'))
        iResArray.addPort(new ir.Port('a', 'analog', 2))
        iResArray.addPort(new ir.Port('b', 'analog', 2))

        const ir1 = new ir.Cell('rx$0', i$R)
        ir1.addParam(new ir.Param('RES', 10e3))

        ir1.addAssign(new ir.Assign(new ir.Ref(i$R.ports[0]), [
            iResArray.ports[0].value[0]
        ]))
        ir1.addAssign(new ir.Assign(new ir.Ref(i$R.ports[1]), [
            iResArray.ports[1].value[0]
        ]))
        iResArray.addCell(ir1)

        const ir2 = new ir.Cell('rx$1', i$R)
        ir2.addParam(new ir.Param('RES', 10e3))
        ir2.addAssign(new ir.Assign(new ir.Ref(i$R.ports[0]), [
            iResArray.ports[0].value[1]
        ]))
        ir2.addAssign(new ir.Assign(new ir.Ref(i$R.ports[1]), [
            iResArray.ports[1].value[1]
        ]))
        iResArray.addCell(ir2)

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

        const i$and = new ir.Module('$and')
        i$and.addAttr(new ir.Attr('name', '$and'))
        i$and.addAttr(new ir.Attr('declare', true))
        i$and.addPort(new ir.Port('A', 'input', 3))
        i$and.addPort(new ir.Port('B', 'input', 3))
        i$and.addPort(new ir.Port('Y', 'output', 1))

        const iAND = new ir.Module('AND')
        iAND.addAttr(new ir.Attr('name', 'AND'))
        iAND.addPort(new ir.Port('a', 'input', 3))
        iAND.addPort(new ir.Port('b', 'input', 3))
        iAND.addPort(new ir.Port('y', 'output', 1))

        const iand1 = new ir.Cell('and1', i$and)
        iand1.addParam(new ir.Param('A_WIDTH', 3))
        iand1.addParam(new ir.Param('B_WIDTH', 3))

        for (let pi = 0; pi < i$and.ports.length; pi++) {
            const ref = new ir.Ref(i$and.ports[pi])
            const sig = iAND.ports[pi].value
            iand1.addAssign(new ir.Assign(ref, sig))
        }
        iAND.addCell(iand1)

        expectIR(AND).with([new ir.Param('WIDTH', 2)]).to.equal(iAND)
    })
})
