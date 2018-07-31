import * as fs from 'fs'
import { IBackend } from '.'
import * as ir from './ir'

class BomItem {
    readonly refs: string[] = []

    constructor(readonly description: string,
                readonly man: string,
                readonly mpn: string) {

    }

    addNetlistInfo(info: NetlistInfo): void {
        this.refs.push(info.ref)
    }

    bomLine(): string {
        return `${this.refs.join(',')}\t` +
            `${this.refs.length.toString()}\t` +
            `${this.description}\t` +
            `${this.man}\t` +
            `${this.mpn}\n`
    }
}

class NetlistInfo {
    value: string | undefined = undefined
    man: string | undefined = undefined
    mpn: string | undefined = undefined

    constructor(readonly ref: string) {

    }

    isComplete(): boolean {
        return !!(this.man && this.mpn)
    }

    getKey(): string {
        return `${this.man}:${this.mpn}`
    }
}


export class BomBackend implements IBackend {

    readonly bom: {[key: string]: BomItem} = {}

    getCellNetlistInfo(cell: ir.ICell): NetlistInfo {
        const info = new NetlistInfo(cell.name)
        for (let attr of cell.attrs) {
            if (attr.name === 'man') {
                info.man = attr.value as string
            } else if (attr.name === 'mpn') {
                info.man = attr.value as string
            } else if (attr.name === 'value') {
                info.value = attr.value as string
            }
        }
        // get info from module
        // for (let attr of cell.module)
        return info
    }

    processModule(mod: ir.IModule): void {
        for (let cell of mod.cells) {
            const info = this.getCellNetlistInfo(cell)
            if (info.isComplete()) {
                const key = info.getKey()
                if (!(key in this.bom)) {
                    this.bom[key] = new BomItem(info.value || '',
                                                info.man || '',
                                                info.mpn || '')
                }
                this.bom[key].addNetlistInfo(info)
            }
        }
    }

    emit(mods: ir.IModule[], outputPath: string): void {
        for (let mod of mods) {
            this.processModule(mod)
        }

        let tsv = 'References\tQty\tDescription\tManufacturer\tMPN\n'
        for (let key in this.bom) {
            tsv += this.bom[key].bomLine()
        }

        fs.writeFileSync(outputPath, tsv)
    }
}
