import { IDoc, nest, enclose, dquotes, braces, brackets, parens,
         intersperse, line, group, indent, render } from 'prettier-printer'
export { render, IDoc } from 'prettier-printer'
import { IAstAssignment, IAstAttribute, IAstCell, IAstConcat, IAstDeclaration,
         IAstDesign, IAstFullyQualifiedName, IAstIdentifier, IAstImport,
         IAstLiteral, IAstModule, IAstParameter, IAstReference, IAstType,
         AstType, AstLiteralType, AstExpr, AstStatement } from './ast'

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
        'import', ' ',
        emitIdentifier(imp['import']),
        ' ', 'from', ' ',
        enclose(dquotes, imp['from']), line
    ]
}

export function emitModule(mod: IAstModule): IDoc {
    return [
        emitAttributes(mod.attributes),
        mod.exported ? 'export ' : '',
        mod.declaration ? 'declare ' : '',
        'module ', emitIdentifier(mod.name), ' ',
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

export function emitIdentifier(id: IAstIdentifier): IDoc {
    return id.id
}

export function emitWidth(width: number): IDoc {
    if (width > 1) {
        return enclose(brackets, width.toString())
    } else {
        return []
    }
}
export function emitType(ty: IAstType): IDoc {
    return [ty.ty, emitWidth(ty.width)]
}

export function emitLiteral(lit: IAstLiteral): IDoc {
    if (lit.literalType === AstLiteralType.Integer) {
        return lit.value.toString()
    } else if (lit.literalType === AstLiteralType.String) {
        return enclose(dquotes, lit.value)
    }
    return lit.value
}

export function emitAttributes(attrs: IAstAttribute[]): IDoc {
    return attrs.map(emitAttribute)
}

export function emitAttribute(attr: IAstAttribute): IDoc {
    return ['@', attr.name, emitParameters(attr.parameters), line]
}

export function emitParameters(params: IAstParameter[]): IDoc {
    return enclose(parens, intersperse(', ', params.map(emitParameter)))
}

export function emitParameter(param: IAstParameter): IDoc {
    let value = null
    if ((param.value as IAstIdentifier).id) {
        value = emitIdentifier(param.value as IAstIdentifier)
    } else {
        value = emitLiteral(param.value as IAstLiteral)
    }

    if (param.name === null) {
        return value
    }
    return [ param.name, '=', value ]
}

// Statements
export function emitStatement(stmt: AstStatement): IDoc {
    if ((stmt as IAstDeclaration).identifier) {
        return emitDeclaration(stmt as IAstDeclaration)
    } else if ((stmt as IAstAssignment).lhs) {
        return emitAssignment(stmt as IAstAssignment)
    } else {
        return emitFullyQualifiedName(stmt as IAstFullyQualifiedName)
    }
}

export function emitDeclaration(decl: IAstDeclaration): IDoc {
    return [
        emitAttributes(decl.attributes),
        emitType(decl['type']), ' ',
        emitIdentifier(decl.identifier)
    ]
}

export function emitAssignment(assign: IAstAssignment): IDoc {
    return [emitExpression(assign.lhs), ' = ', emitExpression(assign.rhs)]
}

export function emitFullyQualifiedName(fqn: IAstFullyQualifiedName): IDoc {
    return [emitAttributes(fqn.attributes), fqn.fqn.map(emitIdentifier).join('.')]
}

// Expressions
export function emitExpression(expr: AstExpr): IDoc {
    if ((expr as IAstLiteral).value) {
        return emitLiteral(expr as IAstLiteral)
    } else if ((expr as IAstIdentifier).id) {
        return emitIdentifier(expr as IAstIdentifier)
    } else if ((expr as IAstReference).identifier) {
        return emitReference(expr as IAstReference)
    } else if ((expr as IAstConcat).expressions) {
        return emitConcat(expr as IAstConcat)
    } else {
        return emitCell(expr as IAstCell)
    }
}

export function emitReference(ref: IAstReference): IDoc {
    const doc = ref.to === ref['from'] ? ref.to.toString()
        : [ref['from'].toString(), ':', ref.to.toString()]
    return [emitIdentifier(ref.identifier), enclose(brackets, doc)]
}

export function emitConcat(concat: IAstConcat): IDoc {
    return enclose(parens, intersperse(', ', concat.expressions.map(emitExpression)))
}

export function emitCell(cell: IAstCell): IDoc {
    let assigns = cell.assignments
        .map(emitAssignment)
        .map((assign) => [assign, ','])
    if (assigns.length > 0) {
        const last = assigns.pop() as IDoc[]
        assigns.push([last[0]])
    }
    return [
        emitIdentifier(cell.cellType),
        emitParameters(cell.parameters),
        emitWidth(cell.width), ' ',
        emitBody(assigns)
    ]
}
