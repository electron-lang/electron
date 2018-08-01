import { IDoc, nest, enclose, braces, parens,
         intersperse, line, render } from 'prettier-printer'
export { render, IDoc } from 'prettier-printer'
import * as ast from './ast'
import { matchASTLiteral, matchASTDecl } from './ast';

const tabWidth = 2

export function printAST(a: ast.Ast): string {
    return render(80, emit(a))
}

export function printDesignAST(ast: ast.IModule[]): string {
    return ast.map((mod) => printAST(mod)).join('\n') + '\n'
}

function emit(a: ast.Ast): IDoc {
    switch(a.tag) {
        case 'module':
            return emitModule(a)
        case 'attr':
            return emitAttr(a)
        case 'assign':
            return emitStmt(a)
        case 'param':
        case 'const':
        case 'port':
        case 'net':
        case 'cell':
            return emitDecl(a)
        case 'ref':
        case 'range':
        case 'tuple':
        case 'inst':
        case 'binop':
            return emitExpr(a)
        default:
            return emitLiteral(a)
    }
}

function emitLiteral(lit: ast.Literal): IDoc {
    return matchASTLiteral<IDoc>({
        Integer: (i) => i.value.toString(),
        BitVector: (bv) => [bv.value.length.toString(), "'", bv.value],
        Unit: (u) => u.orig,
        String: (str) => ['"', str.value, '"'],
        Real: (r) => r.value.toString(),
        Bool: (b) => b.value.toString(),
        Xml: (x) => x.value,
    })(lit)
}

function emitExpr(expr: ast.Expr): IDoc {
    switch(expr.tag) {
        case 'ref':
            return expr.ref.name
        case 'tuple':
            return [
                '(', intersperse(', ', expr.exprs.map(emitExpr)), ')'
            ]
        case 'range':
            return  [
                emitExpr(expr.expr),
                expr.start === expr.end ? [
                    '[', emitExpr(expr.start), ']'
                ] : [
                    '[', emitExpr(expr.start), ':', emitExpr(expr.end), ']'
                ]
            ]
        case 'binop':
            return [emitExpr(expr.lhs), ' ', expr.op, ' ', emitExpr(expr.rhs)]
        case 'inst':
            return emitInst(expr)
        default:
            return emitLiteral(expr)
    }
}

function emitInst(inst: ast.IInst): IDoc {
    const emitConns = (cons: [ast.IRef<ast.Decl>, ast.Expr][]): IDoc => {
        return intersperse(', ', cons.map(([ref, expr]) => {
            return [ref.ref.name, '=', emitExpr(expr)]
        }))
    }
    return [
        inst.mod.ref.anonymous ? emitModule(inst.mod.ref) : inst.mod.ref.name,
        inst.params.length > 0 ? enclose(parens, emitConns(inst.params)) : [],
        inst.conns.length > 0 ? [' ', enclose(braces, emitConns(inst.conns))] : []
    ]
}

function emitDecl(decl: ast.Decl): IDoc {
    const emitAttrs = (attrs: ast.IAttr[]): IDoc => {
        return attrs.length > 0 ? [intersperse(line, attrs.map(emitAttr)), line]
            : []
    }
    const emitWidth = (expr: ast.Expr): IDoc => {
        if (expr.tag === 'integer' && expr.value === 1) {
            return []
        }
        return ['[', emitExpr(expr), ']']
    }
    return matchASTDecl<IDoc>({
        Module: (mod) => emitModule(mod),
        Param: (p) => [p.name, ': ', p.ty],
        Const: (c) => ['const ', c.name],
        Port: (p) => [
            emitAttrs(p.attrs), p.ty, emitWidth(p.width), ' ', p.name
        ],
        Net: (n) => [
            emitAttrs(n.attrs), 'net', emitWidth(n.width), ' ', n.name
        ],
        Cell: (c) => [
            emitAttrs(c.attrs), 'cell', emitWidth(c.width), ' ', c.name
        ],
    })(decl)
}

function emitStmt(stmt: ast.Stmt): IDoc {
    if (stmt.tag === 'assign') {
        return [ emitExpr(stmt.lhs), ' = ', emitExpr(stmt.rhs) ]
    } else {
        return emitDecl(stmt)
    }
}

function emitAttr(attr: ast.IAttr): IDoc {
    return [
        '@', attr.name,
        attr.params.length > 0 ? [
            '(', intersperse(', ', attr.params.map(emitExpr)), ')'
        ] : []
    ]
}

function emitModule(mod: ast.IModule): IDoc {
    return [
        mod.attrs.length > 0 ? [intersperse(line, mod.attrs.map(emitAttr)), line]
            : [],
        mod.exported ? 'export ' : '',
        mod.declaration ? 'declare ' : '',
        'module ', mod.name,
        mod.params.length > 0 ? [
            '(', intersperse(', ', mod.params.map(emitDecl)), ')'
        ] : [],
        ' ',
        emitBody([].concat.apply([], [
            mod.stmts.filter((stmt) => stmt.tag !== 'param')
                .map(emitStmt),
        ])),
        line
    ]
}

function emitBody(doc: IDoc[]): IDoc {
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
