import * as fs from 'fs'
import { netlist, Design, Component, Net, Node } from 'libkicad'
import { Logger } from '../diagnostic'
import { IModuleBackend, ir } from '.'

export class KicadBackend implements IModuleBackend {
    protected design!: Design
    protected nets!: {[n: number]: Net}
    protected netNames!: {[n: number]: string}

    constructor(readonly logger: Logger,
                readonly version: string,
                readonly source: string,
                readonly emitDate=true) {}

    protected cellAsComponent(cell: ir.ICell): Component {
        const comp = new Component({ref: cell.name})

        // get default info from module
        for (let attr of cell.module.attrs) {
            if (attr.name === 'value') {
                comp.value = attr.value as string
            } else if (attr.name === 'footprint') {
                comp.footprint = attr.value as string
            }
        }

        // get overriden info from cell
        for (let attr of cell.attrs) {
            if (attr.name === 'value') {
                comp.value = attr.value as string
            } else if (attr.name === 'footprint') {
                comp.footprint = attr.value as string
            }
        }

        if (!comp.footprint) {
            this.logger.warn(`[kicad] Missing footprint for '${cell.name}'.`, cell.src)
        }

        return comp
    }

    protected processModule(mod: ir.IModule): void {
        for (let net of mod.nets) {
            if (net.value.length > 1) {
                for (let i = 0; i < net.value.length; i++) {
                    const code = net.value[i].value as number
                    this.netNames[code] = net.name + i.toString()
                }
            } else {
                const code = net.value[0].value as number
                this.netNames[code] = net.name
            }
        }

        for (let cell of mod.cells) {
            this.design.addComponent(this.cellAsComponent(cell))

            for (let assign of cell.assigns) {
                for (let i = 0; i < assign.rhs.length; i++) {
                    const sig = assign.rhs[i]
                    if (typeof sig.value === 'string') {
                        this.logger.error('[kicad] Signal is a constant.', assign.src)
                        continue
                    }
                    if (!(sig.value in this.nets)) {
                        const net = Net.create({
                            code: sig.value,
                            name: this.netNames[sig.value],
                        })
                        this.nets[sig.value] = net
                        this.design.addNet(net)
                    }
                    const net = this.nets[sig.value]
                    const pads = assign.lhs.ref
                        .attrs.find((attr) => attr.name === 'pads')
                    if (pads) {
                        for (let pad of pads.value) {
                            net.addNode(new Node({ref: cell.name, pin: pad}))
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
    }

    emit(mod: ir.Module, outputPath: string): void {
        this.design = Design.create(this.version, this.source)
        this.design.tool = `electron ${require('../../package.json').version}`
        this.nets = {}
        this.netNames = {}

        if (!this.emitDate) {
            this.design.date = ''
            this.design.source = ''
        }

        this.processModule(mod)
        const str = netlist.print(this.design)
        fs.writeFileSync(outputPath, str)
    }

}
