import * as path from 'path'
import { Crate } from './crate'
import { HierarchyPass, RenameCellPass } from './passes'
import { ir, YosysBackend, KicadBackend, BomBackend,
         MarkdownBackend } from './backend'

export class Design {
    constructor(readonly crate: Crate, readonly ir: ir.IModule[]) {}

    getModule(modName: string): ir.IModule {
        for (let mod of this.ir) {
            for (let attr of mod.attrs) {
                if (attr.name === 'name' && attr.value == modName) {
                    return mod
                }
            }
        }
        throw new Error(`Module ${modName} not found.`)
    }

    emitDocs() {
        const file = path.join(this.crate.crateInfo.docsDir,
                               this.crate.crateInfo.name)
        const hierarchy = new HierarchyPass()
        const markdownBackend = new MarkdownBackend()
        markdownBackend.emit(hierarchy.transform(this.ir), file + '.md')
    }

    emit(modName: string, fn: (mod: ir.IModule, file: string) => void): void {
        const mod = this.getModule(modName)
        if (mod) {
            const file = path.join(this.crate.crateInfo.buildDir, modName)
            fn(mod, file)
        }
    }

    emitVerilog(modName: string) {
        this.emit(modName, (mod, file) => {
            const yosysBackend = new YosysBackend(file + '.yosys.json', 'verilog')
            yosysBackend.emit(mod, file + '.v')
        })
    }

    emitKicad(modName: string, emitDate=true) {
        this.emit(modName, (mod, file) => {
            const pass1 = new HierarchyPass()
            pass1.hierarchy(mod)
            const pass2 = new RenameCellPass()
            pass2.transform([mod])

            const kicadBackend = new KicadBackend(
                this.crate.logger,
                this.crate.crateInfo.version,
                mod.src.file,
                emitDate,
            )
            kicadBackend.emit(mod, file + '.net')
        })
    }

    emitBom(modName: string) {
        this.emit(modName, (mod, file) => {
            const bomBackend = new BomBackend()
            bomBackend.emit(mod, file + '.tsv')
        })
    }

}
