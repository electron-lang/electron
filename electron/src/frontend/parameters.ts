import * as ast from './ast'

export interface ITypeHandler {
    isValid(value: ast.Expr): boolean
}

const IntegerHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'integer'
    }
}

const StringHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'string'
    }
}

const RealHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'real'
    }
}

const BitVectorHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'bv'
    }
}

const BooleanHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'bool'
    }
}

const OhmHandler = {
    isValid(value: ast.Expr): boolean {
        if (value.tag === 'unit') {
            for (let unit of ['', 'ohm', 'Ohm']) {
                if (value.unit === unit) {
                    return true
                }
            }
        }
        return false
    }
}

const FaradHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'unit' && value.unit === 'F'
    }
}

const HenryHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'unit' && value.unit === 'H'
    }
}

const VoltHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'unit' && value.unit === 'V'
    }
}

const AmpereHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'unit' && value.unit === 'A'
    }
}

const WattHandler: ITypeHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'unit' && value.unit === 'W'
    }
}

const HerzHandler: ITypeHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'unit' && value.unit === 'Hz'
    }
}

const SecondsHandler: ITypeHandler = {
    isValid(value: ast.Expr): boolean {
        return value.tag === 'unit' && value.unit === 's'
    }
}

export const allTypeHandlers: {[ty: string]: ITypeHandler} = {
    Integer: IntegerHandler,
    String: StringHandler,
    Real: RealHandler,
    BitVector: BitVectorHandler,
    Boolean: BooleanHandler,
    Ohm: OhmHandler,
    Farad: FaradHandler,
    Henry: HenryHandler,
    Volt: VoltHandler,
    Ampere: AmpereHandler,
    Watt: WattHandler,
    Herz: HerzHandler,
    Seconds: SecondsHandler,
}
