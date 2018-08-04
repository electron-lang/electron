import * as fs from 'fs'
import * as cl from '@electron-lang/celllib'
import * as ir from './ir'
import { IDesignBackend } from './index'
import { ISrcLoc } from '../diagnostic'

export class JsonBackend implements IDesignBackend {
    constructor(readonly declared: boolean,
                readonly allowBoolean: boolean,
                readonly emitSrcLoc: boolean) {
    }

    emit(mods: ir.IModule[], outputPath: string): void {
        const json = JSON.stringify(this.compileNetlist(mods), null, 2)
        fs.writeFileSync(outputPath, json)
    }

    compileNetlist(mods: ir.IModule[]): cl.INetlist {
        const modules: cl.IModules = {}
        for (let mod of mods) {
            // Skip declared modules
            if (!this.declared) {
                if (mod.attrs.find((attr) => attr.name === 'declare' &&
                                   attr.value === true)) {
                    continue
                }
            }
            modules[mod.name] = this.compileModule(mod)
        }
        return { modules }
    }

    compileModule(m: ir.IModule): cl.IModule {
        const mod: cl.IModule = {
            ports: this.compilePorts(m.ports),
            cells: this.compileCells(m.cells),
            netnames: this.compileNets(m.nets),
        }
        mod.attributes = this.compileAttrs(m.attrs)
        this.compileSrcLoc(mod.attributes, m.src)
        return mod
    }

    compileAttrs(attrs: ir.IAttr[]): cl.IAttrs {
        const attributes: cl.IAttrs = {}
        for (let attr of attrs) {
            attributes[attr.name] = this.compileValue(attr.value)
        }
        return attributes
    }

    compilePorts(ps: ir.IPort[]): cl.IPorts {
        const ports: cl.IPorts = {}
        for (let p of ps) {
            const port: cl.IPort = {
                direction: p.ty,
                bits: this.compileSigs(p.value),
            }
            port.attributes = this.compileAttrs(p.attrs)
            this.compileSrcLoc(port.attributes, p.src)
            ports[p.name] = port
        }
        return ports
    }

    compileCells(cs: ir.ICell[]): cl.ICells {
        const cells: cl.ICells = {}
        for (let c of cs) {
            const cell: cl.ICell = {
                type: c.module.name,
                parameters: this.compileParams(c.params),
                connections: this.compileAssigns(c.assigns),
            }
            cell.attributes = this.compileAttrs(c.attrs)
            this.compileSrcLoc(cell.attributes, c.src)
            cells[c.name] = cell
        }
        return cells
    }

    compileNets(ns: ir.INet[]): cl.INets {
        const nets: cl.INets = {}
        for (let n of ns) {
            const net: cl.INet = {
                hide_name: 0,
                bits: this.compileSigs(n.value),
            }
            net.attributes = this.compileAttrs(n.attrs)
            this.compileSrcLoc(net.attributes, n.src)
            nets[n.name] = net
        }
        return nets
    }

    compileParams(params: ir.IParam[]): cl.IParams {
        const parameters: cl.IParams = {}
        for (let param of params) {
            parameters[param.name] = this.compileValue(param.value)
        }
        return parameters
    }

    compileAssigns(assigns: ir.IAssign[]): cl.IConnections {
        const connections: cl.IConnections = {}
        for (let assign of assigns) {
            connections[assign.lhs.ref.name] = this.compileSigs(assign.rhs)
        }
        return connections
    }

    compileSigs(sigs: ir.ISig[]): cl.Vector {
        return sigs.map((sig) => sig.value)
    }

    compileSrcLoc(attrs: cl.IAttrs, src: ISrcLoc) {
        if (this.emitSrcLoc) {
            attrs.src = src
        }
    }

    compileValue(value: any): any {
        if (!this.allowBoolean && typeof value === 'boolean') {
            return value ? 1 : 0
        }
        return value
    }
}
