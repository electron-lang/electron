import * as fs from 'fs'
import { IBackend, ir } from '.'

export class MarkdownBackend implements IBackend {

    exportTag(exported: boolean): string {
        if (exported) {
            return '<span class="tag export">export</span>'
        }
        return ''
    }

    declareTag(declaration: boolean): string {
        if (declaration) {
            return '<span class="tag declare">declare</span>'
        }
        return ''
    }

    generateDocs(mods: ir.IModule[]): string {
        const attrs: {[name: string]: string | number | boolean | string[]} = {
            doc: '',
            declare: false,
            export: false,
        }

        let doc = ''
        for (let mod of mods) {
            for (let attr of mod.attrs) {
                attrs[attr.name] = attr.value
            }
            const exportTag = this.exportTag(attrs.export as boolean)
            const declareTag = this.declareTag(attrs.declare as boolean)
            doc += `# ${mod.name} ${exportTag} ${declareTag}\n`
            doc += `${attrs.doc}\n`

            if (mod.ports.length > 0) {
                doc += 'Name | Type\n'
                doc += '---- | ----\n'
                for (let port of mod.ports) {
                    doc += `${port.name} | ${port.ty}\n`
                }
            }
        }
        return doc
    }

    emit(mods: ir.IModule[], outputPath: string): void {
        const doc = this.generateDocs(mods)
        fs.writeFileSync(outputPath, doc)
    }
}
