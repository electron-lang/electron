import * as ast from './frontend/ast'

export function generateDocs(mods: ast.IModule[]): string {
    let doc = ''
    for (let mod of mods) {
        doc += mod.doc
    }
    return doc
}
