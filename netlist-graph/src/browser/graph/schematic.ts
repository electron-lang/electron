import { SModelElementSchema } from 'sprotty/lib'
import * as cl from '@electron-lang/celllib'
import { GroupNodeSchema } from './graph-model'

type Symbols = {[moduleName: string]: GroupNodeSchema[]}

export function createSchematicForModule(name: string, mod: cl.IModule,
                                         symbols: Symbols): SModelElementSchema[] {
    const elements: SModelElementSchema[] = []
    // TODO add ports mod.ports
    for (let cellName in mod.cells) {
        const cell = mod.cells[cellName]
        if (cell.type in symbols) {
            const syms = symbols[cell.type]
            for (let sym of syms) {
                const symClone = JSON.parse(JSON.stringify(sym)) as GroupNodeSchema
                symClone.id = `${cellName}:${sym.id}`
                symClone.name = cellName
                symClone.children = symClone.children || []
                for (let port of symClone.children) {
                    port.id = `${cellName}:${port.id}`
                }
                elements.push(symClone)
            }
        } else {
            // TODO add builtins
        }
        for (let portName in cell.connections) {
            const bv = cell.connections[portName]
            // TODO add conns
            bv
        }
    }
    return elements
}
