import * as path from 'path'
import { Crate } from './crate'
import { HierarchyPass } from './passes'
import { ir, YosysBackend, KicadBackend, BomBackend,
         MarkdownBackend } from './backend'

export class Design {
    constructor(readonly crate: Crate, readonly ir: ir.IModule[]) {}

    fileBuildDir() {
        return path.join(this.crate.crateInfo.buildDir,
                         this.crate.crateInfo.name)
    }

    fileDocsDir() {
        return path.join(this.crate.crateInfo.docsDir,
                         this.crate.crateInfo.name)
    }

    emitDocs() {
        const file = this.fileDocsDir()
        const markdownBackend = new MarkdownBackend()
        markdownBackend.emit(this.ir, file + '.md')
    }

    emitVerilog() {
        const file = this.fileBuildDir()
        const yosysBackend = new YosysBackend(file + '.yosys.json', 'verilog')
        yosysBackend.emit(this.ir, file + '.v')
    }

    emitKicad() {
        const file = this.fileBuildDir()
        const hierarchy = new HierarchyPass()
        const kicadBackend = new KicadBackend(
            this.crate.crateInfo.version,
            ''
        )
        kicadBackend.emit(hierarchy.transform(this.ir), file + '.net')
    }

    emitBom() {
        const file = this.fileBuildDir()
        const bomBackend = new BomBackend()
        bomBackend.emit(this.ir, file + '.tsv')
    }

}
