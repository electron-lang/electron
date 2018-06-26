import * as ast from './ast'
import { IDiagnostic } from './diagnostic'

export interface ITypeHandler {
    isValid(value: ast.Literal): boolean
}

const IntegerHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'integer'
    }
}

const StringHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'string'
    }
}

const RealHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'real'
    }
}

const BitVectorHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'bv'
    }
}

const BooleanHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'bool'
    }
}

const OhmHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'unit' && value.unit in ['', 'ohm', 'Ohm']
    }
}

const FaradHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'unit' && value.unit === 'F'
    }
}

const HenryHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'unit' && value.unit === 'H'
    }
}

const VoltHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'unit' && value.unit === 'V'
    }
}

const AmpereHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'unit' && value.unit === 'A'
    }
}

const WattHandler: ITypeHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'unit' && value.unit === 'W'
    }
}

const HerzHandler: ITypeHandler = {
    isValid(value: ast.Literal): boolean {
        return value.tag === 'unit' && value.unit === 'Hz'
    }
}


export const allTypeHandlers: {[ty: string]: ITypeHandler} = {
    Integer: IntegerHandler,
    String: StringHandler,
    Real: RealHandler,
    BitVecotr: BitVectorHandler,
    Boolean: BooleanHandler,
    Ohm: OhmHandler,
    Farad: FaradHandler,
    Henry: HenryHandler,
    Volt: VoltHandler,
    Ampere: AmpereHandler,
    Watt: WattHandler,
    Herz: HerzHandler,
}
