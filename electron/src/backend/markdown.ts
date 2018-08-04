import * as fs from 'fs'
import { IDesignBackend, ir } from '.'

export class MarkdownBackend implements IDesignBackend {

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
        let doc = ''
        const declareLookup: {[name: string]: ir.IModule} = {}
        for (let mod of mods) {
            const attrs: {[name: string]: string | number | boolean | string[]} = {
                doc: '',
                import: false,
                declare: false,
                export: false,
                anonymous: false,
            }
            for (let attr of mod.attrs) {
                attrs[attr.name] = attr.value
            }
            if (attrs.import || attrs.anonymous) {
                continue
            }
            if (attrs.declare) {
                if (declareLookup[mod.name]) {
                    continue
                } else {
                    declareLookup[mod.name] = mod
                }
            }
            const exportTag = this.exportTag(attrs.export as boolean)
            const declareTag = this.declareTag(attrs.declare as boolean)
            doc += `# ${attrs.name} ${exportTag} ${declareTag}\n`
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
