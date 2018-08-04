import { Crate } from './crate'
import { Design } from './design'
import { ir } from './backend'

export class Linker {
    constructor(readonly crate: Crate) {}

    isImported(mod: ir.IModule): boolean {
        for (let attr of mod.attrs) {
            if (attr.name === 'import' && attr.value) {
                return true
            }
        }
        return false
    }

    link(): Design {
        const mods: ir.IModule[] = []
        for (let file of this.crate.files) {
            if (file.info.crate === this.crate.crateInfo.name) {
                for (let mod of file.ir) {
                    mods.push(mod)
                }
            }
        }
        return new Design(this.crate, mods)
    }
}
