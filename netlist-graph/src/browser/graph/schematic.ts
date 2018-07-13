import { SNodeSchema, SEdgeSchema } from 'sprotty/lib'
import * as cl from '@electron-lang/celllib'
import * as urn from './urn'
import { PortNodeSchema, CellNodeSchema, SymbolNodeSchema, NetEdgeSchema,
         sideToOrientation, Side, isPin } from './graph-model'
import { getSideForPort } from './symbol'

export interface ICell extends cl.ICell {
    mod: cl.IModule
    sym: SymbolNodeSchema
}

export interface ICells {
    [cellName: string]: ICell
}

export interface IModule extends cl.IModule {
    cells: ICells
}

interface Net {
    netname: string
    drivers: string[]
    laterals: string[]
    riders: string[]
}

type Nets = {[n: string]: Net}

export function createSchematicForModule(uschem: urn.Schematic, mod: IModule)
: [SNodeSchema[], SEdgeSchema[]] {
    const nodes: SNodeSchema[] = []
    const nets: Nets = {}

    for (let portName in mod.ports) {
        const port = mod.ports[portName]
        const side = getSideForPort(port)
        const uport = urn.Port(uschem, portName)
        const node = <PortNodeSchema> {
            id: urn.toString(uport),
            type: 'node:port',
            urn: uport,
            orient: sideToOrientation(side),
        }
        nodes.push(node)
        addBv(nets, port.bits, uport, side)
    }

    for (let cellName in mod.cells) {
        const cell = mod.cells[cellName]
        const ucell = urn.Cell(uschem, cellName)
        const orient = cell.attributes && cell.attributes.rotate || 0
        const scell = <CellNodeSchema> {
            id: urn.toString(ucell),
            type: 'node:cell',
            urn: ucell,
        }
        if (!cell.sym) continue
        const ssym = JSON.parse(JSON.stringify(cell.sym))
        scell.children = ssym.children
        for (let group of ssym.children) {
            const ugroup = urn.CellGroup(ucell, group.urn.groupName)
            group.id = urn.toString(ugroup)
            group.orient = orient
            for (let pin of group.children || []) {
                if (isPin(pin)) {
                    const portName = pin.urn.portName
                    const uport = urn.CellPort(ucell, portName)
                    pin.id = urn.toString(uport)
                    pin.groupId = group.id
                    if (pin.urn.portName in cell.connections) {
                        const bv = cell.connections[portName]
                        addBv(nets, bv, urn.CellPort(ucell, portName), pin.side)
                    }
                }
            }
        }
        nodes.push(scell)
    }

    for (let netName in mod.netnames) {
        const net = mod.netnames[netName]
        addBv(nets, net.bits, netName, null)
    }

    const edges = createEdges(nets)

    return [nodes, edges]
}

function addBv(nets: Nets, bv: cl.Vector, u: urn.URN | string, side: Side | null) {
    for (let bit of bv) {
        if (typeof bit === 'number') {
            const conns: Net = nets[bit.toString()]
                || {drivers: [], riders: [], laterals: []}
            if (typeof u === 'string') {
                conns.netname = u
            } else {
                if (side === 'left') {
                    conns.drivers.push(urn.toString(u))
                } else if (side === 'right') {
                    conns.riders.push(urn.toString(u))
                } else {
                    conns.laterals.push(urn.toString(u))
                }
            }
            nets[bit] = conns
        }
    }
}

function createEdges(nets: Nets): NetEdgeSchema[] {
    let edges: NetEdgeSchema[] = []
    for (let netid in nets) {
        const net = nets[netid]
        // at least one driver and at least one rider and no laterals
        if (net.drivers.length > 0 && net.riders.length > 0 && net.laterals.length === 0) {
            edges = edges
                .concat(route(net.drivers, net.riders))
        // at least one driver or rider and at least one lateral
        } else if (net.drivers.length + net.riders.length > 0 && net.laterals.length > 0) {
            edges = edges
                .concat(route(net.drivers, net.laterals))
                .concat(route(net.laterals, net.riders))
        // at least two drivers and no riders
        } else if (net.drivers.length > 1 && net.riders.length === 0) {
            // TODO
            edges = edges.concat(route([net.drivers[0]], net.drivers.slice(1)))
        // at least two riders and no drivers
        } else if (net.drivers.length === 0 && net.riders.length > 1) {
            // TODO
            edges = edges.concat(route([net.riders[0]], net.riders.slice(1)))
        // at least two laterals and no driver or riders
        } else if (net.laterals.length > 1) {
            // TODO
            edges = edges.concat(route([net.laterals[0]], net.laterals.slice(1)))
        } else {
            // console.log(net)
        }
    }
    return edges
}

function route(us1: string[], us2: string[]): NetEdgeSchema[] {
    const edges: NetEdgeSchema[] = []

    if (us1.length < 1 || us2.length < 1) {
        return edges
    }

    for (let u1 of us1) {
        for (let u2 of us2) {
            edges.push(<NetEdgeSchema> {
                id: u1 + '-' + u2,
                type: 'edge:net',
                sourceId: u1,
                targetId: u2,
            })
        }
    }
    return edges
}
