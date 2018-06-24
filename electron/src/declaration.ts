import { Ast, IAstDesign, IAstModule, IAstDeclStmt, AstDeclType, AstStmt } from './ast'
import { DiagnosticPublisher } from './diagnostic'

export function extractDeclarations(ast: IAstDesign): IAstModule[] {
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
    return declarations
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
