import { expect } from 'chai'
import { RenameCellPass } from './renamecell'
import * as ir from '../backend/ir'
//import { printIR } from '../backend/printer'

describe('RenameCellPass', () => {

    it('should rename resistors', () => {
        const R = ir.Module('R', [])
        const amod = ir.Module('amod', [])
        amod.cells.push(ir.Cell('r1', R, [], [], []))
        const bmod = ir.Module('bmod', [])
        bmod.cells.push(ir.Cell('r1', R, [], [], []))

        const rename = new RenameCellPass()
        const cellNames: string[] = []
        rename.transform([amod, bmod])
            .forEach((mod) => mod.cells
                     .forEach((cell) => cellNames.push(cell.name)))
        expect(cellNames).to.deep.equal(['r1', 'r2'])
    })

    it('should rename anything', () => {
        const R = ir.Module('R', [])
        const amod = ir.Module('amod', [])
        amod.cells.push(ir.Cell('xyz', R, [], [], []))
        const bmod = ir.Module('bmod', [])
        bmod.cells.push(ir.Cell('xyz', R, [], [], []))

        const rename = new RenameCellPass()
        const cellNames: string[] = []
        rename.transform([amod, bmod])
            .forEach((mod) => mod.cells
                     .forEach((cell) => cellNames.push(cell.name)))
        expect(cellNames).to.deep.equal(['xyz', 'xyz1'])
    })
})
