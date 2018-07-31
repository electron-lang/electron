import * as ir from '../backend/ir'

export interface IPass {
    transform(mod: ir.IModule[]): ir.IModule[]
}

export { FindRootsPass } from './findRoots'
export { HierarchyPass } from './hierarchy'
