import { SModelElementSchema } from 'sprotty/lib'
import * as cl from '@electron-lang/celllib'

export interface IGraphGenerator {
    elements: SModelElementSchema[]

    addNetlist(uri: string, netlist: cl.INetlist): void

    openSchematic(moduleName: string): void

    openNetlist(file: string): void
}

export const IGraphGenerator = Symbol('IGraphGenerator')
