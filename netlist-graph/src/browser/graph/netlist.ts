import { injectable } from 'inversify'
import { SModelIndex, SModelElementSchema } from 'sprotty/lib'
import { IGraphGenerator } from './graph-generator'
import { NetlistModuleNodeSchema, NetlistNetEdgeSchema } from './graph-model'
import * as cl from '@electron-lang/celllib'

@injectable()
export class NetlistGraphGenerator implements IGraphGenerator {
    readonly nodes: NetlistModuleNodeSchema[] = []
    readonly edges: NetlistNetEdgeSchema[] = []
    readonly index = new SModelIndex<SModelElementSchema>()

    addNetlist(netlist: cl.INetlist): void {

    }
}
