import { expect } from 'chai'
import { RenameCellPass } from './renamecell'
import * as ir from '../backend/ir'
//import { printIR } from '../backend/printer'

describe('RenameCellPass', () => {

    it('should rename resistors', () => {
        const R = new ir.Module('R')
        const amod = new ir.Module('amod')
        amod.addCell(new ir.Cell('r1', R))
        const bmod = new ir.Module('bmod')
        bmod.addCell(new ir.Cell('r1', R))

        const rename = new RenameCellPass()
        const cellNames: string[] = []
        rename.transform([amod, bmod])
            .forEach((mod) => mod.cells
                     .forEach((cell) => cellNames.push(cell.name)))
        expect(cellNames).to.deep.equal(['r1', 'r2'])
    })

    it('should rename anything', () => {
        const R = new ir.Module('R')
        const amod = new ir.Module('amod')
        amod.addCell(new ir.Cell('xyz', R))
        const bmod = new ir.Module('bmod')
        bmod.addCell(new ir.Cell('xyz', R))

        const rename = new RenameCellPass()
        const cellNames: string[] = []
        rename.transform([amod, bmod])
            .forEach((mod) => mod.cells
                     .forEach((cell) => cellNames.push(cell.name)))
        expect(cellNames).to.deep.equal(['xyz', 'xyz1'])
    })
})
