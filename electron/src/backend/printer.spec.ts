import { expect } from 'chai'
import { Ident, Ref, Concat, BitVec, Net, Port,
         Attr, Param, Cell, Module } from './ir'
import { print } from './printer'


describe('IR Printer', () => {
    it('should print identifiers', () => {
        expect(print(Ident('a'))).to.equal('a')
    })

    it('should print references', () => {
        expect(print(Ref('a', 0, 2))).to.equal('a[0:2]')
    })

    it('should print concatenations', () => {
        expect(print(Concat(Ident('a'), Ident('b'), Ident('c'))))
            .to.equal('(a, b, c)')
    })

    it('should print bit vectors', () => {
        expect(print(BitVec('0', '1', 'x', 'z'))).to.equal("4'01xz")
    })

    it('should print nets', () => {
        expect(print(Net('a', 1))).to.equal('net a')
        expect(print(Net('a', 2))).to.equal('net[2] a')
    })

    it('should print ports', () => {
        expect(print(Port('a', 'input', 1))).to.equal('input a')
        expect(print(Port('a', 'output', 1))).to.equal('output a')
        expect(print(Port('a', 'inout', 1))).to.equal('inout a')
        expect(print(Port('a', 'analog', 1))).to.equal('analog a')
        expect(print(Port('b', 'input', 2))).to.equal('input[2] b')
    })

    it('should print attrs', () => {
        expect(print(Attr('bom', Param('MAN', 'Yago'), Param('MPN', 'XYZ'))))
            .to.equal('@bom(MAN="Yago", MPN="XYZ")\n')
    })

    it('should print cells', () => {
        expect(print(Cell('R1', '$R'))).to.equal('cell R1 = $R() {}')
    })

    it('should print modules', () => {
        let mod = Module('A')
        expect(print(mod)).to.equal('module A {}')
        mod.attrs.push(Attr('model', Param('MODULE', 'AModel')))
        expect(print(mod)).to.equal('@model(MODULE="AModel")\nmodule A {}')
        mod.attrs = []
        mod.ports.push(Port('in', 'input', 1))
        mod.nets.push(Net('n1', 1))
        expect(print(mod)).to.equal('module A {\n  input in\n  net n1\n}')
    })
})
