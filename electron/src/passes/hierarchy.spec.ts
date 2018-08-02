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
                ir.Module('a', []),
                ir.Module('b', []),
                ir.Module('c', [])
            ]
            expect(findRoots(mods)).to.deep.equal(mods)
        })

        it('should return a in a->b->c', () => {
            const mods = [
                ir.Module('a', []),
                ir.Module('b', []),
                ir.Module('c', [])
            ]
            mods[0].cells.push(ir.Cell('b1', mods[1], [], [], []))
            mods[1].cells.push(ir.Cell('c1', mods[2], [], [], []))
            expect(findRoots(mods)).to.deep.equal([mods[0]])
        })
    })

    describe('findLeafs', () => {
        it('should return a,b,c in a,b,c', () => {
            const mods = [
                ir.Module('a', []),
                ir.Module('b', []),
                ir.Module('c', [])
            ]
            expect(findLeafs(mods)).to.deep.equal(mods)
        })

        it('should return c in a->b->c', () => {
            const mods = [
                ir.Module('a', []),
                ir.Module('b', []),
                ir.Module('c', [])
            ]
            mods[0].cells.push(ir.Cell('b1', mods[1], [], [], []))
            mods[1].cells.push(ir.Cell('c1', mods[2], [], [], []))
            expect(findLeafs(mods)).to.deep.equal([mods[2]])
        })
    })

    it('should remove b in a->b->c', () => {
        const a = ir.Module('a', [])
        const b = ir.Module('b', [])
        const c = ir.Module('c', [])
        const mods = [a, b, c]

        const a_p1 = ir.Port('a_p1', 'analog', [ir.Sig.create()], [])
        const b_p1 = ir.Port('b_p1', 'analog', [ir.Sig.create()], [])
        const c_p1 = ir.Port('c_p1', 'analog', [ir.Sig.create()], [])

        a.ports.push(a_p1)
        b.ports.push(b_p1)
        c.ports.push(c_p1)

        const b1 = ir.Cell('b1', mods[1], [], [], [])
        const c1 = ir.Cell('c1', mods[2], [], [], [])

        a.cells.push(b1)
        b.cells.push(c1)

        b1.assigns.push(ir.Assign(ir.Ref(b_p1, 0), a_p1.value))
        c1.assigns.push(ir.Assign(ir.Ref(c_p1, 0), b_p1.value))

        const pass = new HierarchyPass()
        const res = pass.transform(mods)
        expect(res.length === 2)
        expect(res[0].name === 'a')
        expect(res[1].name === 'c')
        expect(res[0].ports[0].value).to.deep.equal(res[0].cells[0].assigns[0].rhs)
    })
})
