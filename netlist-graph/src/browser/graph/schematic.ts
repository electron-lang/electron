import { SModelElementSchema, SPortSchema } from 'sprotty/lib'
import * as cl from '@electron-lang/celllib'
import * as urn from './urn'
import { PortNodeSchema, //CellNodeSchema,
         sideToOrientation } from './graph-model'
import { getSideForPort, //createSymbolsForModule
       } from './symbol'

export interface ICell extends cl.ICell {
    mod: cl.IModule
}

export interface ICells {
    [cellName: string]: ICell
}

export interface IModule extends cl.IModule {
    cells: ICells
}

export function createSchematicForModule(uschem: urn.Schematic, mod: IModule)
: SModelElementSchema[] {
    const elements: SModelElementSchema[] = []

    for (let portName in mod.ports) {
        const side = getSideForPort(mod.ports[portName])
        const uport = urn.Port(uschem, portName)
        const node = <PortNodeSchema> {
            id: urn.toString(uport),
            type: 'node:port',
            urn: uport,
            orient: sideToOrientation(side),
        }
        node.children = []
        node.children.push(<SPortSchema> {
            id: urn.toString(uport) + ':sport',
            type: 'port'
        })
        elements.push(node)
    }

    for (let cellName in mod.cells) {
        const cell = mod.cells[cellName]
        //const ucell = urn.Cell(uschem, cellName)
        /*const syms =
            createSymbolsForModule(urn.Symbol(uschem.urn), cell.mod) as CellNodeSchema[]
        for (let sym of syms) {
            sym.id = urn.toString(ucell)
            sym.urn = ucell
            sym.children = symClone.children || []
            for (let port of symClone.children) {
                port.id = `${cellName}:${port.id}`
            }
            elements.push(symClone)
            index.add(symClone)
        }*/
        for (let portName in cell.connections) {
            const bv = cell.connections[portName]
            // TODO add conns
            bv
        }
    }
    return elements
}
