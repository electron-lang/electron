import * as ast from './ast'
import { DiagnosticPublisher } from './diagnostic'

export function extractDeclarations(design: ast.IDesign): ast.IModule[] {
    let dmods: ast.IModule[] = []
    for (let mod of design.modules) {
        if (!mod.exported) {
            continue
        }
        let dmod = ast.Module(mod.name)
        dmod.attrs = mod.attrs
        dmod.exported = true
        dmod.declaration = true
        dmod.params = mod.params
        dmod.ports = mod.ports

        for (let setattr of mod.setAttrs) {
            resolveSetAttr(setattr)
            ast.AddStmts(dmod, setattr.stmts)
        }

        dmods.push(dmod)
    }
    return dmods
}

function resolveSetAttr(setattr: ast.ISetAttr) {
    for (let stmt of setattr.stmts) {
        switch(stmt.tag) {
            case 'port':
            case 'net':
            case 'cell':
                stmt.attrs = stmt.attrs.concat(setattr.attrs)
        }
    }
}
