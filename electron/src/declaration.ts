import { readFileSync, writeFileSync } from 'fs'
import { Ast, IAstDesign, IAstModule, IAstDeclStmt, AstDeclType, AstStmt } from './ast'
import { IAstResult } from './diagnostic'
import { elaborate } from './elaborator'
import { print } from './printer'

export function compileDeclaration(path: string, declPath: string): IAstResult {
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
        dmod.statements = getDeclarations(mod.statements)
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

function getDeclarations(stmts: AstStmt[]): IAstDeclStmt[] {
    let decls: IAstDeclStmt[] = []
    for (let stmt of stmts) {
        if (stmt.ast === Ast.Decl) {
            let decl = stmt as IAstDeclStmt
            if (decl.declType === AstDeclType.Analog ||
                decl.declType === AstDeclType.Input ||
                decl.declType === AstDeclType.Output ||
                decl.declType === AstDeclType.Inout) {
                decls.push(decl)
            }
        } else if (stmt.ast === Ast.SetAttributes) {
            let attrs = stmt.attributes
            const ndecls = getDeclarations(stmt.statements)
                .map((decl: IAstDeclStmt) => {
                    decl.attributes = decl.attributes.concat(attrs)
                    return decl
                })
            decls = decls.concat(ndecls)
        }
    }
    return decls
}
