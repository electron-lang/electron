import * as fs from 'fs'
import { Logger } from '../diagnostic'
import { IModuleBackend, ir } from '.'

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
    protected name = ''

    setName(name: string) {
        this.name = name
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

export class KicadBackend implements IModuleBackend {
    protected netlist: string = ''
    protected nets: {[n: number]: Net} = {}

    constructor(readonly logger: Logger,
                readonly version: string,
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

        return info
    }

    processModule(mod: ir.IModule): void {
        for (let cell of mod.cells) {
            const info = this.cellAsComponent(cell)
            if (info.isComplete()) {
                this.netlist += info.component()
            } else {
                this.logger.error(`[kicad] Missing footprint for '${cell.name}'.`, cell.src)
            }
            for (let assign of cell.assigns) {
                for (let i = 0; i < assign.rhs.length; i++) {
                    const sig = assign.rhs[i]
                    if (typeof sig.value === 'string') {
                        this.logger.error('[kicad] Signal is a constant.', assign.src)
                        continue
                    }
                    if (!(sig.value in this.nets)) {
                        this.nets[sig.value] = new Net()
                    }
                    const net = this.nets[sig.value]
                    const pads = assign.lhs.ref
                        .attrs.find((attr) => attr.name === 'pads')
                    if (pads) {
                        for (let pad of pads.value) {
                            net.addNode(new Node(cell.name, pad))
                        }
                    } else {
                        this.logger.error(
                            `[kicad] Cell '${cell.name}' is missing a ` +
                            `pad assignment for port '${assign.lhs.ref.name}'`,
                            assign.src)
                    }
                }
            }
        }
        for (let net of mod.nets) {
            for (let i = 0; i < net.value.length; i++) {
                const sig = net.value[i]
                if (sig.value in this.nets) {
                    this.nets[sig.value as number]
                        .setName(net.name + i.toString())
                }
            }
        }
    }

    emitClose(): void {
        this.netlist = this.netlist.slice(0, -1) + ')\n'
    }

    emit(mod: ir.IModule, outputPath: string): void {
        this.netlist  = `(export (version ${this.version})\n`
        this.netlist += `  (design\n`
        this.netlist += `    (source "${this.source}")\n`
        this.netlist += `    (date "${this.getDate()}")\n`
        this.netlist += `    (tool "electron (${this.getVersion()})"))\n`

        this.netlist += `  (components\n`
        this.processModule(mod)
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
