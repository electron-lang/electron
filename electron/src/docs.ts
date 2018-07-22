import * as ast from './frontend/ast'

function exportTag(mod: ast.IModule): string {
    if (mod.exported) {
        return '<span class="tag export">export</span>'
    }
    return ''
}

function declareTag(mod: ast.IModule): string {
    if (mod.declaration) {
        return '<span class="tag declare">declare</span>'
    }
    return ''
}

export function generateDocs(mods: ast.IModule[]): string {
    let doc = ''
    for (let mod of mods) {
        doc += `# ${mod.name} ${exportTag(mod)} ${declareTag(mod)}\n`
        doc += `${mod.doc}\n`

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
