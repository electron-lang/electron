import * as yosys from 'libyosys';
import { Logger } from '../diagnostic'
import { IModuleBackend, ir } from '.'
import { JsonBackend } from './json'

export type YosysFormat = 'verilog' | 'blif' | 'spice'

export interface YosysOptions {
    logger: Logger,
    jsonPath: string,
    include?: string[]
    format?: YosysFormat,
    triple?: string
}

export class YosysBackend implements IModuleBackend {
    protected jsonBackend: JsonBackend

    constructor(readonly options: YosysOptions) {
        options.include = options.include || []
        options.format = options.format || 'verilog'
        this.jsonBackend = new JsonBackend(false, false, false)
    }

    emit(mod: ir.IModule, outputPath: string): void {
        this.jsonBackend.emit([mod], this.options.jsonPath)

        yosys.setup()

        for (let include of this.options.include || []) {
            yosys.run(`read_verilog ${include}`)
        }

        yosys.run(`read_json ${this.options.jsonPath}`)

        if (this.options.triple) {
            const arch = this.options.triple.split('-')[0]
            yosys.run(`synth_${arch}`)
        }

        yosys.run(`write_${this.options.format} ${outputPath}`)
    }
}
