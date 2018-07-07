import { SModelIndex, SModelElementSchema } from 'sprotty/lib'
import { GroupNodeSchema, NetEdgeSchema } from './graph-model'
import * as cl from '@electron-lang/celllib'

export interface IGraphGenerator {

    readonly nodes: GroupNodeSchema[]
    readonly edges: NetEdgeSchema[]
    readonly index: SModelIndex<SModelElementSchema>

    addNetlist(netlist: cl.INetlist): void
}

export const IGraphGenerator = Symbol('IGraphGenerator')
