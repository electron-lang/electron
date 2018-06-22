import { readFileSync, writeFileSync } from 'fs'
import { Ast, IAstDesign, IAstModule, IAstDeclStmt, AstDeclType } from './ast'
import { IResult } from './diagnostic'
import { elaborate } from './elaborator'
import { print } from './printer'

export function compileDeclaration(path: string, declPath: string): IResult {
    const {ast, errors} = elaborate(path, readFileSync(path).toString())
    if (!ast) {
        return {errors}
    }
    let declarations: IAstModule[] = []
    for (let mod of ast.modules) {
        if (!mod.exported) {
            continue
        }
        let dmod: IAstModule = {
            ast: Ast.Module,
            attributes: mod.attributes,
            exported: true,
            declaration: true,
            identifier: mod.identifier,
            parameters: mod.parameters,
            statements: [],
        }
        for (let stmt of mod.statements) {
            if (stmt.ast !== Ast.Decl) {
                continue
            }
            let decl = stmt as IAstDeclStmt
            if (decl.declType === AstDeclType.Analog ||
                decl.declType === AstDeclType.Input ||
                decl.declType === AstDeclType.Output ||
                decl.declType === AstDeclType.Inout) {
                dmod.statements.push(decl)
            }
        }
        declarations.push(dmod)
    }
    const dast: IAstDesign = {
        ast: Ast.Design,
        imports: [],
        modules: declarations
    }
    const dtext = print(dast)
    writeFileSync(declPath, dtext)
    return {ast: dast, errors}
}
