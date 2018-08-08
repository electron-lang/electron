import { expect } from 'chai'
import { HierarchyPass, findRoots, findLeafs } from './hierarchy'
import * as ir from '../backend/ir'
//import { printIR } from '../backend/printer'

/*function expectPass(input: ir.IModule[], output: ir.IModule[]) {
    const pass = new HierarchyPass()
    expect(pass.transform(input)).to.deep.equal(output)
}*/

describe('HierarchyPass', () => {

    describe('findRoots', () => {
        it('should return a,b,c in a,b,c', () => {
            const mods = [
                new ir.Module('a'),
                new ir.Module('b'),
                new ir.Module('c')
            ]
            expect(findRoots(mods)).to.deep.equal(mods)
        })

        it('should return a in a->b->c', () => {
            const mods = [
                new ir.Module('a'),
                new ir.Module('b'),
                new ir.Module('c')
            ]
            mods[0].addCell(new ir.Cell('b1', mods[1]))
            mods[1].addCell(new ir.Cell('c1', mods[2]))
            expect(findRoots(mods)).to.deep.equal([mods[0]])
        })
    })

    describe('findLeafs', () => {
        it('should return a,b,c in a,b,c', () => {
            const mods = [
                new ir.Module('a'),
                new ir.Module('b'),
                new ir.Module('c')
            ]
            expect(findLeafs(mods)).to.deep.equal(mods)
        })

        it('should return c in a->b->c', () => {
            const mods = [
                new ir.Module('a'),
                new ir.Module('b'),
                new ir.Module('c')
            ]
            mods[0].addCell(new ir.Cell('b1', mods[1]))
            mods[1].addCell(new ir.Cell('c1', mods[2]))
            expect(findLeafs(mods)).to.deep.equal([mods[2]])
        })
    })

    it('should remove b in a->b->c', () => {
        const a = new ir.Module('a')
        const b = new ir.Module('b')
        const c = new ir.Module('c')
        const mods = [a, b, c]

        const a_p1 = new ir.Port('a_p1', 'analog')
        const b_p1 = new ir.Port('b_p1', 'analog')
        const c_p1 = new ir.Port('c_p1', 'analog')

        a.addPort(a_p1)
        b.addPort(b_p1)
        c.addPort(c_p1)

        const b1 = new ir.Cell('b1', mods[1])
        const c1 = new ir.Cell('c1', mods[2])

        a.addCell(b1)
        b.addCell(c1)

        b1.addAssign(new ir.Assign(new ir.Ref(b_p1), a_p1.value))
        c1.addAssign(new ir.Assign(new ir.Ref(c_p1), b_p1.value))

        const pass = new HierarchyPass()
        const res = pass.transform(mods)
        expect(res.length === 2)
        expect(res[0].name === 'a')
        expect(res[1].name === 'c')
        expect(res[0].ports[0].value).to.deep.equal(res[0].cells[0].assigns[0].rhs)
    })
})
