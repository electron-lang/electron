import { injectable } from 'inversify'
import { SModelIndex, SModelElementSchema } from 'sprotty/lib'
import { IGraphGenerator } from './graph-generator'
import { GroupNodeSchema, PinPortSchema, NetEdgeSchema } from './graph-model'
import * as cl from '@electron-lang/celllib'

type PortSide = 'top' | 'left' | 'right' | 'bottom'

interface IPort extends cl.IPort {
    name: string
    pad?: string
    group?: string
    side: PortSide
}

interface IGroup {
    name?: string
    ports: IPort[]
}

function Group(name?: string): IGroup {
    return { name, ports: [] }
}

interface IModule {
    name: string
    groups: IGroup[]
}

class ModuleBuilder {
    private defaultGroup: IGroup = Group()
    private groups: {[key: string]: IGroup} = {}

    constructor(private name: string) {}

    getGroup(name?: string): IGroup {
        if (!name) {
            return this.defaultGroup
        }
        if (!(name in this.groups)) {
            this.groups[name] = Group(name)
        }
        return this.groups[name]
    }

    addPort(name: string, p: cl.IPort) {
        const port = p as IPort
        port.name = name
        port.side = this.getSideForPort(port)

        if (port.attributes && port.attributes['pads']) {
            port.pad = port.attributes['pads'].join(', ')
        }

        if (port.attributes && port.attributes['group']) {
            port.group = port.attributes['group']
        }

        const group = this.getGroup(port.group)
        group.ports.push(port)
    }

    getModule(): IModule {
        const groups = []

        for (let gname in this.groups) {
            groups.push(this.groups[gname])
        }

        if (groups.length < 1) {
            groups.push(this.defaultGroup)
        }

        return { name: this.name, groups }
    }

    protected getSideForPort(port: IPort): PortSide {
        const info = port.attributes && port.attributes['side'] || port.direction
        switch(info) {
            case 'left':
                return 'left'
            case 'right':
                return 'right'
            case 'top':
                return 'top'
            case 'bottom':
                return 'bottom'
            case 'input':
                return 'left'
            case 'output':
                return 'right'
            default:
                return 'left'
        }
    }
}

@injectable()
export class NetlistGraphGenerator implements IGraphGenerator {
    readonly nodes: GroupNodeSchema[] = []
    readonly edges: NetEdgeSchema[] = []
    readonly index = new SModelIndex<SModelElementSchema>()

    addNetlist(netlist: cl.INetlist): void {
        for (let name in netlist.modules) {
            const mod = netlist.modules[name]

            const builder = new ModuleBuilder(name)
            for (let pname in mod.ports) {
                builder.addPort(pname, mod.ports[pname])
            }
            for (let node of this.createModule(name, builder.getModule())) {
                this.nodes.push(node)
            }
        }
    }

    protected createModule(name: string, mod: IModule): GroupNodeSchema[] {
        const groups: GroupNodeSchema[] = []
        for (let group of mod.groups) {
            const gname = group.name ? `${name}_${group.name}` : name
            groups.push(this.createGroup(gname, group.ports))
        }
        return groups
    }

    protected createGroup(name: string, ports: IPort[]): GroupNodeSchema {
        const groupNode: GroupNodeSchema = {
            type: 'node:group',
            id: name,
            layout: 'vbox',
            name,
            ntop: 0,
            nleft: 0,
            nbottom: 0,
            nright: 0,
        }
        groupNode.children = []
        for (let port of ports) {
            if (port.side === 'top') {
                groupNode.ntop += 1
            }
            if (port.side === 'left') {
                groupNode.nleft += 1
            }
            if (port.side === 'bottom') {
                groupNode.nbottom += 1
            }
            if (port.side === 'right') {
                groupNode.nright += 1
            }
            groupNode.children.push(<PinPortSchema> {
                type: `port:${port.side}`,
                id: `${name}:${port.name}/port`,
                side: port.side,
                name: port.name,
                pad: port.pad || '',
            })
        }
        return groupNode
    }

}
