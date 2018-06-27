import { ISrcLoc, emptySrcLoc } from '../diagnostic'

export type IR = IModule | IAttr | IParam | ICell | IAssign | Expr

export interface IRExprPattern<T> {
    Port: (port: IPort) => T
    Net: (net: INet) => T
    BitVec: (bv: IBitVec) => T
    Concat: (ref: IConcat) => T
    Ref: (ref: IRef) => T
}

export interface IRPattern<T> extends IRExprPattern<T> {
    Module: (mod: IModule) => T
    Attr: (attr: IAttr) => T
    Param: (param: IParam) => T
    Cell: (cell: ICell) => T
    Assign: (assign: IAssign) => T
}

export function matchIRExpr<T>(p: IRExprPattern<T>): (ir: Expr) => T {
  return (ir: Expr): T => {
      switch(ir.tag) {
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

export function matchIR<T>(p: IRPattern<T>): (ir: IR) => T {
  return (ir: IR): T => {
      switch(ir.tag) {
          case 'module':
              return p.Module(ir)
          case 'attr':
              return p.Attr(ir)
          case 'param':
              return p.Param(ir)
          case 'cell':
              return p.Cell(ir)
          case 'assign':
              return p.Assign(ir)
          default:
              return matchIRExpr(p)(ir)
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
    value: boolean | number | string
    src: ISrcLoc
}

export function Attr(name: string, value: boolean | number | string,
                     src?: ISrcLoc): IAttr {
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
    value: number | string | boolean | IBitVec
    src: ISrcLoc
}

export function Param(name: string, value: number | string | boolean | IBitVec,
                      src?: ISrcLoc): IParam {
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
    module: IModule
    attrs: IAttr[]
    params: IParam[]
    assigns: IAssign[]
    src: ISrcLoc
}

export function Cell(name: string, mod?: IModule, src?: ISrcLoc): ICell {
    return {
        tag: 'cell',
        name,
        module: mod || Module(''),
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
                     src?: ISrcLoc): IPort {
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

export function Net(name: string, width: number, src?: ISrcLoc): INet {
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
export type Expr = IBitVec | IConcat | IRef | INet | IPort

export interface IBitVec {
    tag: 'bitvec'
    bits: Bit[]
    src: ISrcLoc
}

export type Bit = '0' | '1' | 'x' | 'z'

export function BitVec(bits: Bit[], src?: ISrcLoc): IBitVec {
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

export function Concat(exprs: Expr[]): IConcat {
    return {
        tag: 'concat',
        exprs,
        src: emptySrcLoc,
    }
}

export interface IRef {
    tag: 'ref'
    sig: Expr
    from: number
    to: number
    src: ISrcLoc
}

export function Ref(sig: Expr, from: number, to: number): IRef {
    return {
        tag: 'ref',
        sig,
        from,
        to,
        src: emptySrcLoc,
    }
}
