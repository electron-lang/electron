import { ISrcLoc, SrcLoc } from '../../diagnostic'
import { IAttr } from './attribute'
import { Integer } from './literal'
import { Expr } from './expression'
import { Stmt } from './statement'

export type Decl = IModule | IParam | IConst | IPort | INet | ICell

export interface ASTDeclPattern<T> {
    Module: (m: IModule) => T
    Param: (p: IParam) => T
    Const: (c: IConst) => T
    Port: (p: IPort) => T
    Net: (n: INet) => T
    Cell: (c: ICell) => T
}

export function matchASTDecl<T>(p: ASTDeclPattern<T>): (decl: Decl) => T {
    return (decl: Decl): T => {
        switch(decl.tag) {
            case 'module':
                return p.Module(decl)
            case 'param':
                return p.Param(decl)
            case 'const':
                return p.Const(decl)
            case 'port':
                return p.Port(decl)
            case 'net':
                return p.Net(decl)
            case 'cell':
                return p.Cell(decl)
        }
    }
}

/* Parameter */
export interface IParam {
    tag: 'param'
    name: string
    ty: string
    tySrc: ISrcLoc
    src: ISrcLoc
}

export function Param(name: string, ty: string,
                      src?: ISrcLoc, tySrc?: ISrcLoc): IParam {
    return {
        tag: 'param',
        name,
        ty,
        src: src || SrcLoc.empty(),
        tySrc: tySrc || SrcLoc.empty(),
    }
}
/* Parameter */

/* Integer Constant */
export interface IConst {
    tag: 'const'
    name: string
    src: ISrcLoc
}

export function Const(name: string, src?: ISrcLoc): IConst {
    return {
        tag: 'const',
        name,
        src: src || SrcLoc.empty()
    }
}
/* Integer Constant */

/* Port */
export type PortType = 'input' | 'output' | 'inout' | 'analog'

export interface IPort {
    tag: 'port'
    attrs: IAttr[]
    name: string
    ty: PortType
    width: Expr
    src: ISrcLoc
}

export function Port(name: string, ty: PortType, width?: Expr,
                     src?: ISrcLoc): IPort {
    return {
        tag: 'port',
        attrs: [],
        name,
        ty,
        width: width || Integer(1),
        src: src || SrcLoc.empty(),
    }
}
/* Port */

/* Net */
export interface INet {
    tag: 'net'
    attrs: IAttr[]
    name: string
    width: Expr
    src: ISrcLoc
}

export function Net(name: string, width?: Expr, src?: ISrcLoc): INet {
    return {
        tag: 'net',
        attrs: [],
        name,
        width: width || Integer(1),
        src: src || SrcLoc.empty(),
    }
}
/* Net */

/* Cell */
export interface ICell {
    tag: 'cell'
    attrs: IAttr[]
    name: string
    width: Expr
    src: ISrcLoc
}

export function Cell(name: string, width?: Expr, src?: ISrcLoc): ICell {
    return {
        tag: 'cell',
        attrs: [],
        name,
        width: width || Integer(1),
        src: src || SrcLoc.empty(),
    }
}
/* Cell */

/* Module */
export interface IModule {
    tag: 'module'
    doc: string
    attrs: IAttr[]
    exported: boolean
    declaration: boolean
    anonymous: boolean
    name: string
    params: IParam[]
    ports: IPort[]
    stmts: Stmt[]
    src: ISrcLoc
}

export function Module(name: string | undefined, stmts: Stmt[],
                       src?: ISrcLoc): IModule {
    let mod: IModule = {
        tag: 'module',
        doc: '',
        attrs: [],
        exported: false,
        declaration: false,
        anonymous: name === undefined,
        name: name || '',
        src: src || SrcLoc.empty(),
        ports: [],
        params: [],
        stmts: [],
    }

    for (let stmt of stmts) {
        if (stmt.tag === 'param') {
            mod.params.push(stmt)
        } else {
            if (stmt.tag === 'port') {
                mod.ports.push(stmt)
            }
            if (!mod.declaration && !mod.anonymous) {
                mod.stmts.push(stmt)
            }
        }
    }

    return mod
}
/* Module */
