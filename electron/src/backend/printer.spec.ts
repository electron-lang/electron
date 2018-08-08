import { expect } from 'chai'
import * as ir from './ir'
import { printIR as print } from './printer'


describe('IR Printer', () => {
    it('should print nets', () => {
        expect(print(new ir.Net('a'))).to.equal('net a = (0)')
        expect(print(new ir.Net('a', 2)))
            .to.equal('net[2] a = (1, 2)')
    })

    it('should print ports', () => {
        expect(print(new ir.Port('a', 'input')))
            .to.equal('input a = (3)')
        expect(print(new ir.Port('a', 'output')))
            .to.equal('output a = (4)')
        expect(print(new ir.Port('a', 'inout')))
            .to.equal('inout a = (5)')
        expect(print(new ir.Port('a', 'analog')))
            .to.equal('analog a = (6)')
        expect(print(new ir.Port('b', 'input', 2)))
            .to.equal('input[2] b = (7, 8)')
    })

    it('should print attrs', () => {
        expect(print(new ir.Attr('man', 'Yago')))
            .to.equal('@man("Yago")\n')
    })

    it('should print cells', () => {
        expect(print(new ir.Cell('R1', new ir.Module('$R'))))
            .to.equal('cell R1 = $R() {}')
    })

    it('should print modules', () => {
        let mod = new ir.Module('A')
        expect(print(mod)).to.equal('module A {}')
        mod.addAttr(new ir.Attr('model', 'AModel'))
        expect(print(mod)).to.equal('@model("AModel")\nmodule A {}')
    })

    it('should print dags', () => {
        const $R = new ir.Module('$R')
        const A = new ir.Port('A', 'analog')
        const B = new ir.Port('B', 'analog')
        $R.addPort(A)
        $R.addPort(B)

        const mod = new ir.Module('top')

        const a = new ir.Port('a', 'analog')
        mod.addPort(a)

        const n = new ir.Net('__1')
        mod.addNet(n)

        const b = new ir.Port('b', 'analog')
        mod.addPort(b)


        const r1 = new ir.Cell('r1', $R)
        r1.addAssign(new ir.Assign(new ir.Ref(A), a.value))
        r1.addAssign(new ir.Assign(new ir.Ref(B), n.value))
        mod.addCell(r1)

        const r2 = new ir.Cell('r2', $R)
        r2.addAssign(new ir.Assign(new ir.Ref(A), n.value))
        r2.addAssign(new ir.Assign(new ir.Ref(B), b.value))
        mod.addCell(r2)


        expect(print(mod)).to.equal([
            'module top {',
            '  analog a = (11)',
            '  analog b = (13)',
            '  net __1 = (12)',
            '  cell r1 = $R() {A=(11), B=(12)}',
            '  cell r2 = $R() {A=(12), B=(13)}',
            '}'
        ].join('\n'))
    })
})
