import { ISrcLoc, emptySrcLoc } from '../diagnostic'

export type IR = IModule | IIdent | IAttr | IParam | ICell | IPort | INet
    | IAssign | Expr

export interface IRPattern<T> {
    Module: (mod: IModule) => T
    Ident: (id: IIdent) => T
    Attr: (attr: IAttr) => T
    Param: (param: IParam) => T
    Cell: (cell: ICell) => T
    Port: (port: IPort) => T
    Net: (net: INet) => T
    Assign: (assign: IAssign) => T
    BitVec: (bv: IBitVec) => T
    Concat: (ref: IConcat) => T
    Ref: (ref: IRef) => T
}

export function matchIR<T>(p: IRPattern<T>): (ir: IR) => T {
  return (ir: IR): T => {
      switch(ir.tag) {
          case 'module':
              return p.Module(ir)
          case 'ident':
              return p.Ident(ir)
          case 'attr':
              return p.Attr(ir)
          case 'param':
              return p.Param(ir)
          case 'cell':
              return p.Cell(ir)
          case 'assign':
              return p.Assign(ir)
          case 'port':
              return p.Port(ir)
          case 'net':
              return p.Net(ir)
          case 'bitvec':
              return p.BitVec(ir)
          case 'concat':
              return p.Concat(ir)
          case 'ref':
              return p.Ref(ir)
      }
  }
}


export interface IModule {
    tag: 'module',
    attrs: IAttr[]
    name: string
    ports: IPort[]
    nets: INet[]
    cells: ICell[]
    assigns: IAssign[]
    src: ISrcLoc
}

export function Module(name: string): IModule {
    return {
        tag: 'module',
        attrs: [],
        name,
        ports: [],
        nets: [],
        cells: [],
        assigns: [],
        src: emptySrcLoc,
    }
}

export interface IAttr {
    tag: 'attr'
    name: string
    value: string
    src: ISrcLoc
}

export function Attr(name: string, value: string, src?: ISrcLoc | undefined): IAttr {
    return {
        tag: 'attr',
        name,
        value,
        src: src || emptySrcLoc,
    }
}

export interface IParam {
    tag: 'param'
    name: string
    value: any
    src: ISrcLoc
}

export function Param(name: string, value: any, src?: ISrcLoc | undefined): IParam {
    return {
        tag: 'param',
        name,
        value,
        src: src || emptySrcLoc,
    }
}

export interface ICell {
    tag: 'cell'
    name: string
    module: IIdent
    attrs: IAttr[]
    params: IParam[]
    assigns: IAssign[]
    src: ISrcLoc
}

export function Cell(name: string, modName: string, src?: ISrcLoc | undefined): ICell {
    return {
        tag: 'cell',
        name,
        module: Ident(modName),
        attrs: [],
        params: [],
        assigns: [],
        src: src || emptySrcLoc,
    }
}

export interface IPort {
    tag: 'port'
    attrs: IAttr[],
    ty: PortType
    width: number
    name: string
    src: ISrcLoc
}

export type PortType = 'input' | 'output' | 'inout' | 'analog'

export function Port(name: string, ty: PortType, width: number,
                     src?: ISrcLoc | undefined): IPort {
    return {
        tag: 'port',
        attrs: [],
        ty,
        width,
        name,
        src: src || emptySrcLoc,
    }
}

export interface INet {
    tag: 'net'
    attrs: IAttr[],
    width: number
    name: string
    src: ISrcLoc,
}

export function Net(name: string, width: number, src?: ISrcLoc | undefined): INet {
    return {
        tag: 'net',
        attrs: [],
        width,
        name,
        src: src || emptySrcLoc,
    }
}

export interface IAssign {
    tag: 'assign'
    lhs: Expr
    rhs: Expr
    src: ISrcLoc
}

export function Assign(lhs: Expr, rhs: Expr): IAssign {
    return {
        tag: 'assign',
        lhs,
        rhs,
        src: emptySrcLoc,
    }
}

// Expressions
export type Expr = IBitVec | IConcat | IRef | IIdent

export interface IBitVec {
    tag: 'bitvec'
    bits: Bit[]
    src: ISrcLoc
}

export type Bit = '0' | '1' | 'x' | 'z'

export function BitVec(bits: Bit[], src?: ISrcLoc | undefined): IBitVec {
    return {
        tag: 'bitvec',
        bits,
        src: emptySrcLoc,
    }
}

export interface IConcat {
    tag: 'concat'
    exprs: Expr[]
    src: ISrcLoc
}

export function Concat(...exprs: Expr[]): IConcat {
    return {
        tag: 'concat',
        exprs,
        src: emptySrcLoc,
    }
}

export interface IRef {
    tag: 'ref'
    ident: IIdent
    from: number
    to: number
    src: ISrcLoc
}

export function Ref(id: string, from: number, to: number): IRef {
    return {
        tag: 'ref',
        ident: Ident(id),
        from,
        to,
        src: emptySrcLoc,
    }
}

export interface IIdent {
    tag: 'ident'
    text: string
    src: ISrcLoc
}

export function Ident(text: string): IIdent {
    return {
        tag: 'ident',
        text,
        src: emptySrcLoc,
    }
}
