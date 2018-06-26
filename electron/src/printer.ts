import { IDoc, nest, enclose, dquotes, braces, brackets, parens,
         intersperse, line, group, indent, render } from 'prettier-printer'
export { render, IDoc } from 'prettier-printer'
import * as ast from './ast'

const tabWidth = 2

export function printAST(a: ast.Ast): string {
    return render(80, emit(a))
}

function emit(a: ast.Ast): IDoc {
    return ast.matchAST({
        Design: emitDesign,
        Import: emitImport,
        Module: emitModule,
        //FQN: emitFQN,
        Attr: emitAttr,
        ParamDecl: emitParamDecl,
        Param: emitParam,
        SetAttr: emitSetAttr,
        Const: emitConst,
        Net: emitNet,
        Port: emitPort,
        Cell: emitCell,
        //With: emitWith,
        Assign: emitAssign,
        Tuple: emitTuple,
        AnonMod: emitAnonMod,
        Ident: emitIdent,
        Ref: emitRef,
        ModInst: emitModInst,
        BinOp: emitBinOp,
        Integer: emitInteger,
        String: emitString,
        BitVector: emitBitVector,
        Unit: emitUnit,
        Real: emitReal,
        Bool: emitBool,
    })(a)
}

function emitDesign(design: ast.IDesign): IDoc {
    return [
        design.imports.map(emitImport),
        design.modules.map(emitModule)
    ]
}

function emitImport(imp: ast.IImport): IDoc {
    return [
        'import ',
        emitIdents(imp.ids),
        ' from ',
        enclose(dquotes, imp.package),
        line
    ]
}

function emitModule(mod: ast.IModule): IDoc {
    return [
        emitAttrs(mod.attrs),
        mod.exported ? 'export ' : '',
        mod.declaration ? 'declare ' : '',
        'module ', mod.name,
        emitParamDecls(mod.params),
        ' ',
        emitBody([].concat.apply([], [
            mod.consts.map(emitConst),
            mod.ports.map(emitPort),
            mod.nets.map(emitNet),
            mod.cells.map(emitCell),
            mod.assigns.map(emitAssign),
            //mod.withs.map(emitWith)
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

/*function emitFQNs(fqns: ast.IFQN[]): IDoc {
    return intersperse(', ', fqns.map(emitFQN))
}

function emitFQN(fqn: ast.IFQN): IDoc {
    return intersperse('.', fqn.ids.map(emitIdent))
}*/

function emitIdents(ids: ast.IIdent[]): IDoc {
    return intersperse(', ', ids.map(emitIdent))
}

function emitIdent(id: ast.IIdent): IDoc {
    return id.id
}

function emitAttrs(attrs: ast.IAttr[]): IDoc {
    return [
        intersperse(line, attrs.map(emitAttr)),
        attrs.length > 0 ? line : []
    ]
}

function emitAttr(attr: ast.IAttr): IDoc {
    return ['@', emitIdent(attr.name),
            emitParams(attr.params)]
}

function emitParamDecls(params: ast.IParamDecl[]): IDoc {
    if (params.length > 0) {
        return enclose(parens, intersperse(',', params.map(emitParamDecl)))
    }
    return []
}

function emitParamDecl(param: ast.IParamDecl): IDoc {
    if (typeof param.name === 'number') {
        return [emitIdent(param.ty)]
    }
    return [emitIdent(param.name), ': ', emitIdent(param.ty)]
}

function emitParams(params: ast.IParam[]): IDoc {
    return enclose(parens, intersperse(', ', params.map(emitParam)))
}

function emitParam(param: ast.IParam): IDoc {
    if (typeof param.name === 'number') {
        return [emit(param.value)]
    }
    return [ emitIdent(param.name), '=', emit(param.value) ]
}

function emitSetAttr(setattr: ast.ISetAttr): IDoc {
    const body = [].concat.apply([], [setattr.stmts.map(emit),
                                      //emitFQNs(setattr.fqns)
                                     ])
    if (body.length > 1) {
        return [
            emitAttrs(setattr.attrs)[0], ' ',
            emitBody(body)
        ]
    }
    return [ emitAttrs(setattr.attrs), body ]
}

function emitWidth(width: ast.Expr): IDoc {
    if (width.tag === 'integer' && width.value === 1) {
        return []
    }
    return enclose(brackets, emit(width))
}

function emitConst(c: ast.IConst): IDoc {
    return [ 'const ', emitIdent(c.ident) ]
}

function emitNet(n: ast.INet): IDoc {
    return [ emitAttrs(n.attrs), 'net', emitWidth(n.width), ' ',
             emitIdent(n.ident) ]
}

function emitPort(p: ast.IPort): IDoc {
    return [ emitAttrs(p.attrs), p.ty, emitWidth(p.width), ' ',
             emitIdent(p.ident) ]
}

function emitCell(c: ast.ICell): IDoc {
    return [ emitAttrs(c.attrs), 'cell', emitWidth(c.width), ' ',
             emitIdent(c.ident) ]
}

/*function emitWith(w: ast.IWith): IDoc {
    return [ 'with ', emitFQN(w.scope), emitBody(w.setattrs.map(emitSetAttr)) ]
}*/

function emitAssign(assign: ast.IAssign): IDoc {
    return [ emit(assign.lhs), ' = ', emit(assign.rhs) ]
}

function emitTuple(tuple: ast.ITuple): IDoc {
    return enclose(parens, intersperse(', ', tuple.exprs.map(emit)))
}

function emitAnonMod(amod: ast.IAnonMod): IDoc {
    return [ 'module', emitBody([
        amod.ports.map(emitPort),
        amod.setattrs.map(emitSetAttr),
        amod.assigns.map(emitAssign)
    ])]
}

function emitRef(ref: ast.IRef): IDoc {
    let from_ = emit(ref['from'])
    let to = emit(ref['to'])
    const doc = from_ === to ? [ from_ ] : [from_, ':', to]
    return [emitIdent(ref.ident), enclose(brackets, doc)]
}

function emitModInst(inst: ast.IModInst): IDoc {
    return [
        inst.module,
        emitParams(inst.params),
        ' ', emitDict(inst.dict)
    ]
}

function emitBinOp(bo: ast.IBinOp): IDoc {
    return [ emit(bo.lhs), bo.op, emit(bo.rhs) ]
}

function emitInteger(int: ast.IInteger): IDoc {
    return int.value.toString()
}

function emitString(str: ast.IString): IDoc {
    return enclose(dquotes, str.value)
}

function emitBitVector(bv: ast.IBitVector): IDoc {
    return [bv.value.length.toString(), "'", bv.value]
}

function emitUnit(u: ast.IUnit): IDoc {
    const exp: {[k: string]: string} = {
        '9': 'G',
        '6': 'M',
        '3': 'K',
        '0': '',
        '-3': 'm',
        '-6': 'u',
        '-9': 'n',
        '-12': 'p',
        '-15': 'f',
    }
    return [ u.value.toString(), exp[u.exp.toString()], u.unit ]
}

function emitReal(r: ast.IReal): IDoc {
    return r.value.toString()
}

function emitBool(b: ast.IBool): IDoc {
    return b.toString()
}

function emitDictEntry(entry: ast.IDictEntry): IDoc {
    return [emitIdent(entry.ident), '=', emit(entry.expr)]
}

function emitDict(dict: ast.IDict): IDoc {
    let entries = dict.entries.map(emitDictEntry)
    if (dict.star) {
        entries.push('*')
    }
    return enclose(braces, intersperse(', ', entries))
}
