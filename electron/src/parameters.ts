import { IAstLiteral, AstLiteralType } from './ast'
import { IDiagnostic } from './diagnostic'

export interface ITypeHandler {
    isValid(value: IAstLiteral): boolean
}

const IntegerHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.Integer
    }
}

const StringHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.String
    }
}

const RealHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.Real
    }
}

const BitVectorHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.BitVector
    }
}

const BooleanHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.Boolean
    }
}

const OhmHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.Unit &&
            /[0-9][GMKkmunpf]?$/.test(value.value)
    }
}

const FaradHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.Unit &&
            /[0-9][GMKkmunpf]?F$/.test(value.value)
    }
}

const HenryHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.Unit &&
            /[0-9][GMKkmunpf]?H$/.test(value.value)
    }
}

const VoltHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.Unit &&
            /[0-9][GMKkmunpf]?V$/.test(value.value)
    }
}

const AmpereHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.Unit &&
            /[0-9][GMKkmunpf]?A$/.test(value.value)
    }
}

const WattHandler: ITypeHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.Unit &&
            /[0-9][GMKkmunpf]?W$/.test(value.value)
    }
}

const HerzHandler: ITypeHandler = {
    isValid(value: IAstLiteral): boolean {
        return value.litType === AstLiteralType.Unit &&
            /[0-9][GMKkmunpf]?Hz$/.test(value.value)
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
