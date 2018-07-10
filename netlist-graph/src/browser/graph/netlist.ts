import { injectable } from 'inversify'
import { SModelElementSchema, SModelIndex } from 'sprotty/lib'
import * as cl from '@electron-lang/celllib'
import { IGraphGenerator } from './graph-generator'
import { FileNodeSchema, isFile,
         ModuleNodeSchema, isModule,
         SymbolNodeSchema, isSymbol,
         SchematicNodeSchema, isSchematic } from './graph-model'
import * as urn from './urn'
import { createSymbolsForModule } from './symbol'
import { IModule, createSchematicForModule } from './schematic'

type Map<T> = {[key: string]: T}

@injectable()
export class NetlistGraphGenerator implements IGraphGenerator {
    // lookup table for cell types
    readonly modules: Map<cl.IModule> = {}

    readonly index: SModelIndex<SModelElementSchema> = new SModelIndex()
    readonly elements: SModelElementSchema[] = []

    addNetlist(uri: string, netlist: cl.INetlist): void {
        for (let modName in netlist.modules) {
            this.modules[modName] = netlist.modules[modName]
        }
        const ufile = urn.File(uri)
        const sfile = this.createFile(ufile, netlist)
        this.index.add(sfile)
        this.elements.push(sfile)
        this.openFile(ufile)
    }

    private createFile(ufile: urn.File, netlist: cl.INetlist): FileNodeSchema {
        const sfile = <FileNodeSchema> {
            id: urn.toString(ufile),
            type: 'node:file',
            urn: ufile,
        }
        sfile.children = []
        for (let name in netlist.modules) {
            const mod = netlist.modules[name]
            const umod = urn.Module(ufile, name)
            const smod = this.createModule(umod, mod)
            sfile.children.push(smod)
        }
        return sfile
    }

    private createModule(umod: urn.Module, mod: cl.IModule): ModuleNodeSchema {
        const smod = <ModuleNodeSchema> {
            id: urn.toString(umod),
            type: 'node:module',
            urn: umod,
            hidden: true,
        }
        smod.children = []
        smod.children.push(this.createSymbol(urn.Symbol(umod), mod))
        smod.children.push(this.createSchematic(urn.Schematic(umod), mod))
        return smod
    }

    private createSymbol(usym: urn.Symbol, mod: cl.IModule): SymbolNodeSchema {
        const ssym = <SymbolNodeSchema> {
            id: urn.toString(usym),
            type: 'node:symbol',
            urn: usym,
            hidden: true,
            children: createSymbolsForModule(usym, mod),
        }
        return ssym
    }

    private resolveModule(mod: cl.IModule): IModule {
        const newMod = mod as IModule
        for (let cellName in newMod.cells) {
            const cell = newMod.cells[cellName]
            cell.mod = this.modules[cell.type]
        }
        return newMod
    }

    private createSchematic(uschem: urn.Schematic, mod: cl.IModule): SchematicNodeSchema {
        const sschem = <SchematicNodeSchema> {
            id: urn.toString(uschem),
            type: 'node:schematic',
            urn: uschem,
            hidden: true,
            children: createSchematicForModule(uschem, this.resolveModule(mod))
        }
        return sschem
    }

    openUrn(urname: urn.URN): void {
        switch (urname.tag) {
            case 'file':
                return this.openFile(urname)
            case 'schematic':
                return this.openSchematic(urname)
            case 'schematic-port':
            case 'schematic-cell':
            case 'schematic-net':
                return this.openSchematic(urname.urn)
        }
    }

    private openFile(ufile: urn.File): void {
        for (let elem of this.index.all()) {
            if (isFile(elem)) {
                elem.hidden = elem.urn.uri !== ufile.uri
            } else if (isModule(elem)) {
                elem.hidden = false
            } else if (isSymbol(elem)) {
                elem.hidden = false
            } else if (isSchematic(elem)) {
                elem.hidden = true
            }
        }
    }

    private openSchematic(uschem: urn.Schematic): void {
        for (let elem of this.index.all()) {
            if (isFile(elem)) {
                elem.hidden = elem.urn.uri !== uschem.urn.urn.uri
            } else if (isModule(elem)) {
                elem.hidden = elem.urn.modName !== uschem.urn.modName
            } else if (isSymbol(elem)) {
                elem.hidden = true
            } else if (isSchematic(elem)) {
                elem.hidden = elem.urn.urn.modName !== uschem.urn.modName
            }
        }
    }
}
