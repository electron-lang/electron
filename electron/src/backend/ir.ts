import { ISrcLoc, emptySrcLoc } from '../diagnostic'

export type IR = IModule | IAttr | IParam | ICell | IPort | INet | IAssign

export interface IRPattern<T> {
    Module: (mod: IModule) => T
    Attr: (attr: IAttr) => T
    Param: (param: IParam) => T
    Cell: (cell: ICell) => T
    Port: (port: IPort) => T
    Net: (net: INet) => T
    Assign: (assign: IAssign) => T
}

export function matchIR<T>(p: IRPattern<T>): (ir: IR) => T {
    return (ir) => {
        switch(ir.tag) {
            case 'module':
                return p.Module(ir)
            case 'attr':
                return p.Attr(ir)
            case 'param':
                return p.Param(ir)
            case 'cell':
                return p.Cell(ir)
            case 'port':
                return p.Port(ir)
            case 'net':
                return p.Net(ir)
            case 'assign':
                return p.Assign(ir)
        }
    }
}

export interface SigPattern<T> {
    Bit: (bit: Bit) => T
    NC: () => T
    Ref: (ref: number) => T
}

export function matchSig<T>(p: SigPattern<T>): (sig: ISig) => T {
    return (sig) => {
        if (sig.value === null) {
            return p.NC()
        } else if (typeof sig.value === 'string') {
            return p.Bit(sig.value)
        } else {
            return p.Ref(sig.value)
        }
    }
}

export type Bit = '0' | '1' | 'x' | 'z'

export interface IRef<T> {
    tag: 'ref'
    ref: T
    index: number
}

export function Ref<T>(ref: T, index: number): IRef<T> {
    return {
        tag: 'ref',
        ref,
        index,
    }
}

export interface ISig {
    tag: 'sig'
    value: Bit | number
}

let sigCounter = 0
export function Sig(value?: Bit): ISig {
    if (typeof value === 'undefined') {
        return {
            tag: 'sig',
            value: sigCounter++,
        }
    }
    return {
        tag: 'sig',
        value,
    }
}
export function _resetSigCounter() {
    sigCounter = 0
}

export interface IModule {
    tag: 'module',
    attrs: IAttr[]
    name: string
    ports: IPort[]
    nets: INet[]
    cells: ICell[]
    src: ISrcLoc
}

export function Module(name: string, attrs: IAttr[], src?: ISrcLoc): IModule {
    return {
        tag: 'module',
        attrs,
        name,
        ports: [],
        nets: [],
        cells: [],
        src: src || emptySrcLoc,
    }
}

export interface IAttr {
    tag: 'attr'
    name: string
    value: number | string | boolean
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
    value: number | string | boolean | Bit[]
    src: ISrcLoc
}

export function Param(name: string, value: number | string | boolean | Bit[],
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
    module: IModule | string
    attrs: IAttr[]
    params: IParam[]
    assigns: IAssign[]
    src: ISrcLoc
}

export function Cell(name: string, mod: IModule | string, params: IParam[],
                     assigns: IAssign[], attrs: IAttr[], src?: ISrcLoc): ICell {
    return {
        tag: 'cell',
        name,
        module: mod,
        attrs,
        params,
        assigns,
        src: src || emptySrcLoc,
    }
}

export interface IPort {
    tag: 'port'
    attrs: IAttr[],
    ty: PortType
    name: string
    value: ISig[]
    src: ISrcLoc
}

export type PortType = 'input' | 'output' | 'inout' | 'analog'

export function Port(name: string, ty: PortType, value: ISig[],
                     attrs: IAttr[], src?: ISrcLoc): IPort {
    return {
        tag: 'port',
        attrs,
        ty,
        name,
        value,
        src: src || emptySrcLoc,
    }
}

export interface INet {
    tag: 'net'
    attrs: IAttr[],
    name: string
    value: ISig[]
    src: ISrcLoc,
}

export function Net(name: string, value: ISig[], attrs: IAttr[],
                    src?: ISrcLoc): INet {
    return {
        tag: 'net',
        attrs,
        name,
        value,
        src: src || emptySrcLoc,
    }
}

export interface IAssign {
    tag: 'assign'
    lhs: IRef<IPort>
    rhs: ISig[]
    src: ISrcLoc
}

export function Assign(lhs: IRef<IPort>, rhs: ISig[], src?: ISrcLoc): IAssign {
    return {
        tag: 'assign',
        lhs,
        rhs,
        src: src || emptySrcLoc,
    }
}
