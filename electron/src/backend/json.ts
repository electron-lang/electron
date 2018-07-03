import * as cl from '@electron-lang/celllib'
import * as ir from './ir'

export function compileNetlist(mods: ir.IModule[]): cl.INetlist {
    const modules: cl.IModules = {}
    for (let mod of mods) {
        modules[mod.name] = compileModule(mod)
    }
    return { modules }
}

function compileModule(mod: ir.IModule): cl.IModule {
    return {
        attributes: compileAttrs(mod.attrs),
        ports: compilePorts(mod.ports),
        cells: compileCells(mod.cells),
        netnames: compileNets(mod.nets),
    }
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
        ports[p.name] = {
            attributes: compileAttrs(p.attrs),
            direction: p.ty,
            bits: compileSigs(p.value),
        }
    }
    return ports
}

function compileCells(cs: ir.ICell[]): cl.ICells {
    const cells: cl.ICells = {}
    for (let c of cs) {
        cells[c.name] = {
            type: typeof c.module === 'string' ? c.module : c.module.name,
            attributes: compileAttrs(c.attrs),
            parameters: compileParams(c.params),
            connections: compileAssigns(c.assigns),
        }
    }
    return cells
}

function compileNets(ns: ir.INet[]): cl.INets {
    const nets: cl.INets = {}
    for (let n of ns) {
        nets[n.name] = {
            attributes: compileAttrs(n.attrs),
            hide_name: 0,
            bits: compileSigs(n.value),
        }
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
