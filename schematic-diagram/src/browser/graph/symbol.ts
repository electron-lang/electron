import { PreRenderedElementSchema } from 'sprotty/lib'
import { Side, GroupNodeSchema, PinPortSchema } from './graph-model'
import * as urn from './urn'
import * as cl from '@electron-lang/celllib'

export function getSideForPort(port: cl.IPort): Side {
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

export function createSymbolsForModule(usym: urn.Symbol, mod: cl.IModule)
: GroupNodeSchema[] {
    const builder = new ModuleBuilder()
    for (let pname in mod.ports) {
        builder.addPort(pname, mod.ports[pname])
    }

    const skin = mod.attributes && mod.attributes.skin

    const groups: GroupNodeSchema[] = []
    for (let group of builder.getGroups()) {
        const ugroup = urn.SymGroup(usym, group.name)
        groups.push(createGroup(ugroup, group.ports, skin))
    }
    return groups
}

function createGroup(ugroup: urn.SymGroup, ports: IPort[], skin?: string): GroupNodeSchema {
    const groupNode: GroupNodeSchema = {
        id: urn.toString(ugroup),
        type: 'node:group',
        urn: ugroup,
        layout: 'vbox',
        ntop: 0,
        nleft: 0,
        nbottom: 0,
        nright: 0,
        orient: 0,
        skin: !!skin,
        link: urn.Schematic(ugroup.urn.urn)
    }
    groupNode.children = []
    if (skin) {
        groupNode.children.push(<PreRenderedElementSchema> {
            type: 'pre-rendered',
            code: skin,
        })
    }
    for (let port of ports) {
        const uport = urn.SymPort(ugroup, port.name)
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
        const pin = <PinPortSchema> {
            id: urn.toString(uport),
            type: 'port:pin',
            urn: uport,
            side: port.side,
            pad: port.pads[0] || '',
            fixed: !!skin,
            trace: port.attributes && port.attributes.src,
            padPin: 0,
        }
        if (port.attributes
            && typeof port.attributes['port_x'] === 'number'
            && typeof port.attributes['port_y'] === 'number') {
            pin.position = {
                x: port.attributes['port_x'],
                y: port.attributes['port_y']
            }
        }
        groupNode.children.push(pin)

        if (port.pads.length > 1) {
            for (let i = 1; i < port.pads.length; i++) {
                const padPin: PinPortSchema = JSON.parse(JSON.stringify(pin))
                padPin.id += ':' + i.toString()
                padPin.pad = port.pads[i]
                padPin.padPin = i
                groupNode.children.push(padPin)
            }
        }
    }
    return groupNode
}

interface IPort extends cl.IPort {
    name: string
    pads: string[]
    group: string
    side: Side
}

interface IGroup {
    name: string
    ports: IPort[]
}

function Group(name: string): IGroup {
    return { name, ports: [] }
}

class ModuleBuilder {
    private groups: {[key: string]: IGroup} = {}

    getGroup(name: string): IGroup {
        if (!(name in this.groups)) {
            this.groups[name] = Group(name)
        }
        return this.groups[name]
    }

    addPort(name: string, p: cl.IPort) {
        const port = p as IPort
        port.name = name
        port.side = getSideForPort(port)

        port.pads = port.attributes && port.attributes['pads'] || []
        port.group = port.attributes && port.attributes['group'] || 'default'

        const group = this.getGroup(port.group)
        group.ports.push(port)
    }

    getGroups(): IGroup[] {
        const groups = []

        for (let gname in this.groups) {
            groups.push(this.groups[gname])
        }

        return groups
    }
}
