import { SModelIndex, SModelElementSchema } from 'sprotty/lib'
import { NetlistModuleNodeSchema, NetlistNetEdgeSchema } from './graph-model'
import * as cl from '@electron-lang/celllib'

export interface IGraphGenerator {

    readonly nodes: NetlistModuleNodeSchema[]
    readonly edges: NetlistNetEdgeSchema[]
    readonly index: SModelIndex<SModelElementSchema>

    addNetlist(netlist: cl.INetlist): void
}

export const IGraphGenerator = Symbol('IGraphGenerator')
