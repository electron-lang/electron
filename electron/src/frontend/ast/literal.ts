import { ISrcLoc, emptySrcLoc } from '../../diagnostic'

export type Literal = IInteger | IBitVector | IUnit | IString | IReal | IBool

export interface ASTLiteralPattern<T> {
    Integer: (int: IInteger) => T
    String: (str: IString) => T
    BitVector: (bv: IBitVector) => T
    Unit: (u: IUnit) => T
    Real: (r: IReal) => T
    Bool: (b: IBool) => T
}

export function matchASTLiteral<T>(p: ASTLiteralPattern<T>): (lit: Literal) => T {
    return (lit: Literal): T => {
        switch(lit.tag) {
            case 'integer':
                return p.Integer(lit)
            case 'bv':
                return p.BitVector(lit)
            case 'unit':
                return p.Unit(lit)
            case 'string':
                return p.String(lit)
            case 'real':
                return p.Real(lit)
            case 'bool':
                return p.Bool(lit)
        }
    }
}

/* Integer */
export interface IInteger {
    tag: 'integer'
    value: number
    src: ISrcLoc
}

export function Integer(value: number, src?: ISrcLoc): IInteger {
    return {
        tag: 'integer',
        value,
        src: src || emptySrcLoc,
    }
}
/* Integer */

/* BitVector */
export type Bit = '0' | '1' | 'x' | 'z'
export interface IBitVector {
    tag: 'bv'
    value: Bit[]
    src: ISrcLoc
}

export function BitVector(value: Bit[], src?: ISrcLoc): IBitVector {
    return {
        tag: 'bv',
        value,
        src: src || emptySrcLoc,
    }
}
/* BitVector */

/* Unit */
export interface IUnit {
    tag: 'unit'
    value: number
    orig: string
    unit: string
    src: ISrcLoc
}

export function Unit(unit: string, src?: ISrcLoc): IUnit {
    const regex = /([0-9\.]*)([GMKkmunpf]?)([a-zA-Z]*)/;
    const parts = unit.match(regex) as any
    const exp = ((prefix) => {
        switch (prefix) {
            case 'G': return 9
            case 'M': return 6
            case 'k':
            case 'K': return 3
            case 'm': return -3
            case 'u': return -6
            case 'n': return -9
            case 'p': return -12
            case 'f': return -15
            default: return 0
        }
    })(parts[2])
    const value = parseFloat(parts[1]) * 10 ** exp
    return {
        tag: 'unit',
        value,
        unit: parts[3],
        orig: unit,
        src: src || emptySrcLoc,
    }
}
/* Unit */

/* String */
export interface IString {
    tag: 'string'
    value: string
    src: ISrcLoc
}

export function String(value: string, src?: ISrcLoc): IString {
    return {
        tag: 'string',
        value,
        src: src || emptySrcLoc,
    }
}
/* String */

/* Real */
export interface IReal {
    tag: 'real'
    value: number
    src: ISrcLoc
}

export function Real(value: number, src?: ISrcLoc): IReal {
    return {
        tag: 'real',
        value,
        src: src || emptySrcLoc,
    }
}
/* Real */

/* Bool */
export interface IBool {
    tag: 'bool'
    value: boolean
    src: ISrcLoc
}

export function Bool(value: boolean, src?: ISrcLoc): IBool {
    return {
        tag: 'bool',
        value,
        src: src || emptySrcLoc,
    }
}
/* Bool */
