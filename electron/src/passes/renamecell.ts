import { IPass } from '.'
import { Logger } from '../diagnostic'
import * as ir from '../backend/ir'

export class RenameCellPass implements IPass {
    protected cellIndex!: {[name: string]: ir.ICell}
    protected prefixIndex!: {[prefix: string]: number}
    protected defaultIndex!: number

    readonly cellNameRegex = /([a-zA-Z]+)([0-9]+)/;

    constructor(readonly logger: Logger) {}

    rename(name: string): string {
        const parts = name.match(this.cellNameRegex)
        let prefix = ''
        let index = 0
        if (parts) {
            prefix = parts[1]
            index = this.prefixIndex[prefix] || 1
        } else {
            prefix = name
            index = this.defaultIndex
        }

        do {
            name = prefix + (index++).toString()
        } while (name in this.cellIndex)

        if (parts) {
            this.prefixIndex[prefix] = index
        } else {
            this.defaultIndex = index
        }

        return name
    }

    transform(mods: ir.IModule[]): ir.IModule[] {
        this.cellIndex = {}
        this.prefixIndex = {}
        this.defaultIndex = 1

        for (let mod of mods) {
            for (let cell of mod.cells) {
                if (cell.name in this.cellIndex) {
                    cell.name = this.rename(cell.name)
                }
                this.cellIndex[cell.name] = cell
            }
        }

        return mods
    }
}
