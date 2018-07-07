import { injectable } from 'inversify'
import { SModelElementSchema } from 'sprotty/lib'
import * as cl from '@electron-lang/celllib'
import { IGraphGenerator } from './graph-generator'
import { GroupNodeSchema } from './graph-model'
import { createSymbolsForModule } from './symbol'
import { createSchematicForModule } from './schematic'

@injectable()
export class NetlistGraphGenerator implements IGraphGenerator {
    private schematics: {[moduleName: string]: SModelElementSchema[]} = {}
    private symbols: {[moduleName: string]: GroupNodeSchema[]} = {}
    private files: {[uri: string]: GroupNodeSchema[]} = {}

    elements: SModelElementSchema[] = []


    addNetlist(uri: string, netlist: cl.INetlist): void {
        this.files[uri] = []
        for (let name in netlist.modules) {
            const mod = netlist.modules[name]
            const syms = createSymbolsForModule(name, mod)
            for (let sym of syms) {
                this.files[uri].push(sym)
            }
            this.symbols[name] = syms
        }

        for (let name in netlist.modules) {
            const mod = netlist.modules[name]
            this.schematics[name] = createSchematicForModule(name, mod, this.symbols)
        }

        this.openNetlist(uri)
    }

    openNetlist(uri: string): void {
        this.elements = this.files[uri]
    }

    openSchematic(moduleName: string): void {
        this.elements = this.schematics[moduleName]
    }
}
