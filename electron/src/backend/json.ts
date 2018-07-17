import * as cl from '@electron-lang/celllib'
import * as ir from './ir'

export function compileNetlist(mods: ir.IModule[]): cl.INetlist {
    const modules: cl.IModules = {}
    for (let mod of mods) {
        modules[mod.name] = compileModule(mod)
    }
    return { modules }
}

function compileModule(m: ir.IModule): cl.IModule {
    const mod: cl.IModule = {
        ports: compilePorts(m.ports),
        cells: compileCells(m.cells),
        netnames: compileNets(m.nets),
    }
    mod.attributes = compileAttrs(m.attrs)
    mod.attributes.src = m.src
    return mod
}

function compileAttrs(attrs: ir.IAttr[]): cl.IAttrs {
    const attributes: cl.IAttrs = {}
    for (let attr of attrs) {
        attributes[attr.name] = attr.value
    }
    return attributes
}

function compilePorts(ps: ir.IPort[]): cl.IPorts {
    const ports: cl.IPorts = {}
    for (let p of ps) {
        const port: cl.IPort = {
            direction: p.ty,
            bits: compileSigs(p.value),
        }
        port.attributes = compileAttrs(p.attrs)
        port.attributes.src = p.src
        ports[p.name] = port
    }
    return ports
}

function compileCells(cs: ir.ICell[]): cl.ICells {
    const cells: cl.ICells = {}
    for (let c of cs) {
        const cell: cl.ICell = {
            type: typeof c.module === 'string' ? c.module : c.module.name,
            parameters: compileParams(c.params),
            connections: compileAssigns(c.assigns),
        }
        cell.attributes = compileAttrs(c.attrs)
        cell.attributes.src = c.src
        cells[c.name] = cell
    }
    return cells
}

function compileNets(ns: ir.INet[]): cl.INets {
    const nets: cl.INets = {}
    for (let n of ns) {
        const net: cl.INet = {
            hide_name: 0,
            bits: compileSigs(n.value),
        }
        net.attributes = compileAttrs(n.attrs)
        net.attributes.src = n.src
        nets[n.name] = net
    }
    return nets
}

function compileParams(params: ir.IParam[]): cl.IParams {
    const parameters: cl.IParams = {}
    for (let param of params) {
        parameters[param.name] = param.value
    }
    return parameters
}

function compileAssigns(assigns: ir.IAssign[]): cl.IConnections {
    const connections: cl.IConnections = {}
    for (let assign of assigns) {
        connections[assign.lhs.ref.name] = compileSigs(assign.rhs)
    }
    return connections
}

function compileSigs(sigs: ir.ISig[]): cl.Vector {
    return sigs.map((sig) => sig.value)
}
