import { Crate } from './crate'
import { Design } from './design'
import { ir } from './backend'

export class Linker {
    constructor(readonly crate: Crate) {}

    link(): Design {
        const mods: ir.IModule[] = []
        for (let file of this.crate.files) {
            for (let mod of file.ir) {
                let imported = false
                for (let attr of mod.attrs) {
                    if (attr.name === 'import' && attr.value) {
                        imported = true
                    }
                }
                if (!imported) {
                    mods.push(mod)
                }
            }
        }
        return new Design(this.crate, mods)
    }
}
