import * as fs from 'fs'
import { IBackend } from './index'
import * as ir from './ir'

class Component {
    value: string | undefined = undefined
    footprint: string | undefined = undefined

    constructor(readonly ref: string) {

    }

    isComplete(): boolean {
        return !!this.footprint
    }

    component(): string {
        return (
            `    (comp (ref ${this.ref})\n` +
            `      (value "${this.value}")\n` +
            `      (footprint ${this.footprint}))\n`
        )
    }
}

class Node {
    constructor(readonly ref: string, readonly pin: string) {

    }

    node(): string {
        return `      (node (ref ${this.ref}) (pin ${this.pin}))`
    }
}

class Net {
    readonly nodes: Node[] = []

    constructor(readonly name: string) {

    }

    addNode(node: Node): void {
        this.nodes.push(node)
    }

    net(code: number): string {
        return (
            `    (net (code ${code}) (name "${this.name}")\n` +
            `${this.nodes.map((n) => n.node()).join('\n')})\n`
        )
    }
}

export class KicadBackend implements IBackend {
    protected netlist: string = ''
    protected nets: {[n: number]: Net} = {}

    constructor(readonly version: string,
                readonly source: string) {

    }

    getDate(): string {
        return new Date().toISOString().
            replace(/T/, ' ').      // replace T with a space
            replace(/\..+/, '')     // delete the dot and everything after
    }

    getVersion(): string {
        return require('../../package.json').version
    }

    cellAsComponent(cell: ir.ICell): Component {
        const info = new Component(cell.name)

        // get default info from module
        for (let attr of cell.module.attrs) {
            if (attr.name === 'value') {
                info.value = attr.value as string
            } else if (attr.name === 'footprint') {
                info.footprint = attr.value as string
            }
        }

        // get overriden info from cell
        for (let attr of cell.attrs) {
            if (attr.name === 'value') {
                info.value = attr.value as string
            } else if (attr.name === 'footprint') {
                info.footprint = attr.value as string
            }
        }

        if (!info.isComplete()) {
            this.processModule(cell.module)
        }

        return info
    }

    processModule(mod: ir.IModule): void {
        for (let cell of mod.cells) {
            const info = this.cellAsComponent(cell)
            if (info.isComplete()) {
                this.netlist += info.component()
            }
        }
    }

    emitClose(): void {
        this.netlist = this.netlist.slice(0, -1) + ')\n'
    }

    emit(mods: ir.IModule[], outputPath: string): void {
        this.netlist  = `(export (version ${this.version})\n`
        this.netlist += `  (design\n`
        this.netlist += `    (source "${this.source}")\n`
        this.netlist += `    (date "${this.getDate()}")\n`
        this.netlist += `    (tool "electron (${this.getVersion()})"))\n`

        this.netlist += `  (components\n`
        for (let mod of mods) {
            this.processModule(mod)
        }
        this.emitClose()

        this.netlist += `  (nets\n`
        let i = 0
        for (let net in this.nets) {
            this.netlist += this.nets[net].net(i++)
        }
        this.emitClose()

        this.emitClose()

        fs.writeFileSync(outputPath, this.netlist)
    }

}
