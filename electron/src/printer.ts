import { IDoc, nest, enclose, dquotes, braces, brackets, parens,
         intersperse, line, group, indent, render } from 'prettier-printer'
export { render, IDoc } from 'prettier-printer'
import { IAstAssignStmt, IAstAttribute, IAstModInst, IAstTuple,
         IAstDeclStmt, IAstDesign, IAstFQN, IAstIdentifier,
         IAstImport, IAstLiteral, IAstModule, IAstParam, IAstReference,
         AstDeclType, AstLiteralType, AstExpr, AstStmt, IAstDict,
    IAstDictEntry,
    IAstParamDecl} from './ast'

const tabWidth = 2

export function print(design: IAstDesign): string {
    return render(80, emitDesign(design))
}

export function emitDesign(design: IAstDesign): IDoc {
    return [
        design.imports.map(emitImport),
        design.modules.map(emitModule)
    ]
}

export function emitImport(imp: IAstImport): IDoc {
    return [
        'import ',
        emitIdentifiers(imp.identifiers),
        ' from ',
        enclose(dquotes, imp.package),
        line
    ]
}

export function emitModule(mod: IAstModule): IDoc {
    return [
        emitAttributes(mod.attributes),
        mod.exported ? 'export ' : '',
        mod.declaration ? 'declare ' : '',
        'module ', emitIdentifier(mod.identifier),
        emitParamDecls(mod.parameters),
        ' ',
        emitBody(mod.statements.map(emitStatement)),
        line
    ]
}

export function emitBody(doc: IDoc[]): IDoc {
    if (doc.length < 1) {
        return '{}'
    }
    return [
        '{',
        nest(tabWidth, [
            line,
            intersperse(line, doc),
        ]),
        line,
        '}'
    ]
}

export function emitIdentifiers(ids: IAstIdentifier[]): IDoc {
    return intersperse(', ', ids.map(emitIdentifier))
}

export function emitIdentifier(id: IAstIdentifier): IDoc {
    return id.id
}

export function emitWidth(width: AstExpr): IDoc {
    if ((width as IAstLiteral).value == '1') {
        return []
    }
    return enclose(brackets, emitExpression(width))
}

export function emitLiteral(lit: IAstLiteral): IDoc {
    return lit.value
}

export function emitAttributes(attrs: IAstAttribute[]): IDoc {
    return attrs.map(emitAttribute)
}

export function emitAttribute(attr: IAstAttribute): IDoc {
    return ['@', emitIdentifier(attr.name),
            emitParameters(attr.parameters), line]
}

export function emitParameters(params: IAstParam[]): IDoc {
    return enclose(parens, intersperse(', ', params.map(emitParameter)))
}

export function emitParameter(param: IAstParam): IDoc {
    if (param.identifier.id.startsWith('__')) {
        return [ emitExpression(param.value) ]
    }
    return [ emitIdentifier(param.identifier), '=', emitExpression(param.value) ]
}

export function emitParamDecls(params: IAstParamDecl[]): IDoc {
    if (params.length > 0) {
        return enclose(parens, intersperse(',', params.map(emitParamDecl)))
    }
    return []
}

export function emitParamDecl(param: IAstParamDecl): IDoc {
    return [emitIdentifier(param.identifier), ': ', emitIdentifier(param.ty)]
}

// Statements
export function emitStatement(stmt: AstStmt): IDoc {
    if ((stmt as IAstDeclStmt).identifier) {
        return emitDeclStmt(stmt as IAstDeclStmt)
    } else if ((stmt as IAstAssignStmt).lhs) {
        return emitAssignStmt(stmt as IAstAssignStmt)
    } else {
        return '' //emitFullyQualifiedName(stmt as IAstFullyQualifiedName)
    }
}

export function emitDeclStmt(decl: IAstDeclStmt): IDoc {

    return [
        decl.declType.toString(),
        emitWidth(decl.width), ' ',
        emitIdentifier(decl.identifier)
    ]
}

export function emitAssignStmt(assign: IAstAssignStmt): IDoc {
    return [emitExpression(assign.lhs), ' = ', emitExpression(assign.rhs)]
}

export function emitFullyQualifiedName(fqn: IAstFQN): IDoc {
    return intersperse('.', fqn.fqn.map(emitIdentifier))
}

// Expressions
export function emitExpression(expr: AstExpr): IDoc {
    if ((expr as IAstLiteral).value) {
        return emitLiteral(expr as IAstLiteral)
    } else if ((expr as IAstIdentifier).id) {
        return emitIdentifier(expr as IAstIdentifier)
    } else if ((expr as IAstReference).identifier) {
        return emitReference(expr as IAstReference)
    } else if ((expr as IAstTuple).expressions) {
        return emitConcat(expr as IAstTuple)
    } else {
        return emitCell(expr as IAstModInst)
    }
}

export function emitReference(ref: IAstReference): IDoc {
    let from_ = emitExpression(ref['from'])
    let to = emitExpression(ref['to'])
    const doc = from_ === to ? [ from_ ] : [from_, ':', to]
    return [emitIdentifier(ref.identifier), enclose(brackets, doc)]
}

export function emitConcat(concat: IAstTuple): IDoc {
    return enclose(parens, intersperse(', ', concat.expressions.map(emitExpression)))
}

export function emitDictEntry(entry: IAstDictEntry): IDoc {
    return [emitIdentifier(entry.identifier), '=', emitExpression(entry.expr)]
}

export function emitDict(dict: IAstDict): IDoc {
    return enclose(braces, intersperse(', ', dict.entries.map(emitDictEntry)))
}

export function emitCell(cell: IAstModInst): IDoc {
    return [
        emitIdentifier(cell.module),
        emitParameters(cell.parameters),
        emitWidth(cell.width), ' ',
        emitDict(cell.dict)
    ]
}
