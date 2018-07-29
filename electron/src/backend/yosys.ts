import * as yosys from 'libyosys';
import * as ir from './ir';
import { IBackend } from './index'
import { JsonBackend } from './json'

export type YosysFormat = 'verilog' | 'blif' | 'spice'
export type YosysArch = 'ice40' | 'ecp5' | 'intel' | 'xilinx'

export class YosysBackend implements IBackend {
    protected jsonBackend: JsonBackend

    constructor(readonly jsonPath: string,
                readonly format: YosysFormat,
                readonly arch?: YosysArch) {

        this.jsonBackend = new JsonBackend(false, false, false)
    }

    emit(mods: ir.IModule[], outputPath: string): void {
        this.jsonBackend.emit(mods, this.jsonPath)

        yosys.setup()

        yosys.run(`read_json ${this.jsonPath}`)

        if (this.arch) {
            yosys.run(`synth_${this.arch}`)
        }

        yosys.run(`write_${this.format} ${outputPath}`)
    }
}
