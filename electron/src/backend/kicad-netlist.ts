import * as fs from 'fs'
import { IBackend } from './index'
import * as ir from './ir'

export class KicadNetlistBackend implements IBackend {
    protected netlist: string = ''

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

    emitComponent(mod: ir.IModule): void {
        let declared = false
        let value = ''
        let footprint = ''

        for (let attr of mod.attrs) {
            if (attr.name === 'declare' && attr.value === true) {
                declared = true
            } else if (attr.name === 'value') {
                value = attr.value as string
            } else if (attr.name === 'footprint') {
                footprint = attr.value as string
            }
        }

        if (!declared) {
            this.netlist += `    (comp (ref ${mod.name})\n`
            this.netlist += `      (value ${value})\n`
            this.netlist += `      (footprint ${footprint})\n`
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
            this.emitComponent(mod)
        }
        this.emitClose()
        this.netlist += `  (nets\n`
        // emitNets
        // (net (code 0) (name "VI")
        //  (node (ref R1) (pin 1)))
        this.emitClose()
        this.emitClose()

        fs.writeFileSync(outputPath, this.netlist)
    }

}
