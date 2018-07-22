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
    private modules: Map<cl.IModule> = {}
    private symbols: Map<SymbolNodeSchema> = {}
    private navStack: urn.URN[] = []

    readonly index: SModelIndex<SModelElementSchema> = new SModelIndex()
    readonly elements: SModelElementSchema[] = []

    addNetlist(uri: string, netlist: cl.INetlist): void {
        const ufile = urn.File(uri)
        for (let modName in netlist.modules) {
            const mod = netlist.modules[modName]
            this.modules[modName] = mod
            const sym =
                this.createSymbol(urn.Symbol(urn.Module(ufile, modName)), mod)
            this.symbols[modName] = sym
        }
        const sfile = this.createFile(ufile, netlist)
        this.updateFile(sfile)
    }

    protected updateFile(file: FileNodeSchema): void {
        for (let i = 0; i < this.elements.length; i++) {
            const elem = this.elements[i]
            if (isFile(elem) && elem.urn.uri === file.urn.uri) {
                this.index.remove(elem)
                this.elements[i] = file
                this.index.add(file)
                this.open(file.urn)
                return
            }
        }
        this.index.add(file)
        this.elements.push(file)
        this.open(file.urn)
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
            trace: mod.attributes && mod.attributes.src
        }
        smod.children = []
        smod.children.push(this.symbols[umod.modName])
        const schematic = this.createSchematic(urn.Schematic(umod), mod)
        if (schematic) {
            smod.children.push(schematic)
        }
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
            cell.sym = this.symbols[cell.type]
        }
        return newMod
    }

    private createSchematic(uschem: urn.Schematic, mod: cl.IModule)
    : SchematicNodeSchema | undefined {
        const imod = this.resolveModule(mod)
        if (imod.attributes && imod.attributes.declare) return

        const [nodes, edges] =
            createSchematicForModule(uschem, imod)
        const sschem = <SchematicNodeSchema> {
            id: urn.toString(uschem),
            type: 'node:schematic',
            urn: uschem,
            hidden: true,
            children: nodes.concat(edges),
        }
        return sschem
    }

    open(urname: urn.URN): void {
        if (!this.index.getById(urn.toString(urname))) return
        this.navStack.push(urname)
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

    close(): void {
        if (this.navStack.length > 1) {
            this.navStack.pop()
            this.open(this.navStack.pop() as urn.URN)
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
