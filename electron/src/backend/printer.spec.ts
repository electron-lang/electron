import { expect } from 'chai'
import * as ir from './ir'
import { printIR as print } from './printer'


describe('IR Printer', () => {
    it('should print nets', () => {
        expect(print(ir.Net('a', [ ir.Sig() ], []))).to.equal('net a = (0)')
        expect(print(ir.Net('a', [ ir.Sig(), ir.Sig() ], [])))
            .to.equal('net[2] a = (1, 2)')
    })

    it('should print ports', () => {
        expect(print(ir.Port('a', 'input', [ ir.Sig() ], [])))
            .to.equal('input a = (3)')
        expect(print(ir.Port('a', 'output', [ ir.Sig() ], [])))
            .to.equal('output a = (4)')
        expect(print(ir.Port('a', 'inout', [ ir.Sig() ], [])))
            .to.equal('inout a = (5)')
        expect(print(ir.Port('a', 'analog', [ ir.Sig() ], [])))
            .to.equal('analog a = (6)')
        expect(print(ir.Port('b', 'input', [ ir.Sig(), ir.Sig() ], [])))
            .to.equal('input[2] b = (7, 8)')
    })

    it('should print attrs', () => {
        expect(print(ir.Attr('man', 'Yago')))
            .to.equal('@man(Yago)\n')
    })

    it('should print cells', () => {
        expect(print(ir.Cell('R1', ir.Module('$R', []), [], [], [])))
            .to.equal('cell R1 = $R() {}')
    })

    it('should print modules', () => {
        let mod = ir.Module('A', [])
        expect(print(mod)).to.equal('module A {}\n')
        mod.attrs.push(ir.Attr('model', 'AModel'))
        expect(print(mod)).to.equal('@model(AModel)\nmodule A {}\n')
        mod.attrs = []
    })

    it('should print dags', () => {
        const $R = ir.Module('$R', [])
        const A = ir.Port('A', 'analog', [], [])
        const B = ir.Port('B', 'analog', [], [])
        $R.ports = [ A, B ]

        const mod = ir.Module('top', [])
        const sigs: ir.ISig[] = [ ir.Sig(), ir.Sig(), ir.Sig() ]

        const a = ir.Port('a', 'analog', [ sigs[0] ], [])

        const r1 = ir.Cell('r1', $R, [], [
            ir.Assign(ir.Ref(A, 0), [ sigs[0] ]),
            ir.Assign(ir.Ref(B, 0), [ sigs[1] ]),
        ], [])

        const r2 = ir.Cell('r2', $R, [], [
            ir.Assign(ir.Ref(A, 0), [ sigs[1] ]),
            ir.Assign(ir.Ref(B, 0), [ sigs[2] ]),
        ], [])

        mod.cells = [r1, r2]

        const b = ir.Port('b', 'analog', [ sigs[2] ], [])
        mod.ports = [a, b]

        const n = ir.Net('__1', [ sigs[1] ], [])
        mod.nets = [n]

        expect(print(mod)).to.equal([
            'module top {',
            '  analog a = (9)',
            '  analog b = (11)',
            '  net __1 = (10)',
            '  cell r1 = $R() {A=(9), B=(10)}',
            '  cell r2 = $R() {A=(10), B=(11)}',
            '}\n'
        ].join('\n'))
    })
})
