import { Ast, IAstAttribute, IAstLiteral, AstLiteralType, IAstParam } from './ast'
import { DiagnosticPublisher, emptySrcLoc } from './diagnostic'
import { IAttr, Attr } from './backend/ir'

export interface IAttributeHandler {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean
    compile(attr: IAstAttribute): IAttr[]
}

function validateParameters(logger: DiagnosticPublisher, attr: IAstAttribute,
                            message: string, tys: AstLiteralType[]): boolean {
    let ok = true
    // No parameters and not enough parameters
    if (attr.parameters.length < 1 && tys.length > 0 ||
        attr.parameters.length < tys.length) {
        logger.error(message, attr.name.src)
        ok = false
    }
    // Check each supplied parameter
    for (let i = 0; i < attr.parameters.length; i++) {
        let param = attr.parameters[i]
        if (!(i < tys.length) || param.value.ast !== Ast.Literal) {
            logger.error(message, param.value.src)
            ok = false
            continue
        }
        const lit = param.value
        if (lit.litType !== tys[i]) {
            logger.error(message, param.value.src)
            ok = false
        }
    }
    return ok
}

function param2value(param: IAstParam): string {
    const lit = param.value as IAstLiteral
    return (() => {
        switch(lit.litType) {
            case AstLiteralType.Boolean:
            case AstLiteralType.String:
            case AstLiteralType.Integer:
            case AstLiteralType.BitVector:
            case AstLiteralType.Unit:
            case AstLiteralType.Real:
                return lit.value
        }
    })()
}

/* Attributes for Schematic generation */
const RotateAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        let message = `'@${attr.name.id}' takes one parameter of type Integer\n` +
            ` - allowed values are 0, 90, 180, 270`

        if (!validateParameters(logger, attr, message, [AstLiteralType.Integer])) {
            return false
        }

        const value = ((attr.parameters[0].value) as IAstLiteral).value
        switch(value) {
            case '0':
            case '90':
            case '180':
            case '270':
                break
            default:
                logger.error(message, attr.parameters[0].value.src)
                return false
        }
        return true
    },

    compile(attr: IAstAttribute): IAttr[] {
        return [
            Attr('rotate', param2value(attr.parameters[0]), attr.name.src)
        ]
    }
}

const LeftAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        const message = `@${attr.name.id} takes no parameters.`
        return validateParameters(logger, attr, message, [])
    },

    compile(attr: IAstAttribute): IAttr[] {
        return [ Attr('side', 'left', attr.name.src) ]
    }
}

const RightAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        const message = `@${attr.name.id} takes no parameters.`
        return validateParameters(logger, attr, message, [])
    },

    compile(attr: IAstAttribute): IAttr[] {
        return [ Attr('side', 'right', attr.name.src) ]
    }
}

const TopAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        const message = `@${attr.name.id} takes no parameters.`
        return validateParameters(logger, attr, message, [])
    },

    compile(attr: IAstAttribute): IAttr[] {
        return [ Attr('side', 'top', attr.name.src) ]
    }
}

const BottomAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        const message = `@${attr.name.id} takes no parameters.`
        return validateParameters(logger, attr, message, [])
    },

    compile(attr: IAstAttribute): IAttr[] {
        return [ Attr('side', 'bottom', attr.name.src) ]
    }
}

const GroupAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        const message = `@${attr.name.id} takes one parameter of type String.`
        return validateParameters(logger, attr, message, [AstLiteralType.String])
    },

    compile(attr: IAstAttribute): IAttr[] {
        return [ Attr('group', param2value(attr.parameters[0]), attr.name.src) ]
    }
}

const PowerAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        const message = `@${attr.name.id} takes no parameters.`
        return validateParameters(logger, attr, message, [])
    },

    compile(attr: IAstAttribute): IAttr[] {
        return [ Attr('splitnet', '$vcc', attr.name.src) ]
    }
}

const GroundAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        const message = `@${attr.name.id} takes no parameters.`
        return validateParameters(logger, attr, message, [])
    },

    compile(attr: IAstAttribute): IAttr[] {
        return [ Attr('splitnet', '$gnd', attr.name.src) ]
    }
}

/* Attributes for RTL */
const ClockAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        const message = `@${attr.name.id} takes no parameters.`
        return validateParameters(logger, attr, message, [])
    },

    compile(attr: IAstAttribute): IAttr[] {
        // TODO
        return []
    }
}

/* Attributes for BOM generation */
const BomAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        const message = `@${attr.name.id} takes two parameters of type String.`
        return validateParameters(logger, attr, message,
                           [AstLiteralType.String, AstLiteralType.String])
    },

    compile(attr: IAstAttribute): IAttr[] {
        return [
            Attr('man', param2value(attr.parameters[0]),
                 attr.parameters[0].value.src),
            Attr('mpn', param2value(attr.parameters[1]),
                 attr.parameters[1].value.src)
        ]
    }
}

/* Attributes for Simulation */
const ModelAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        // TODO
        return true
    },

    compile(attr: IAstAttribute): IAttr[] {
        return []
    }
}

/* Attributes for PCB generation */
const SetPadAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        // TODO
        return true
    },

    compile(attr: IAstAttribute): IAttr[] {
        return []
    }
}

/* Attributes for FPGA bitstream generation */
const FpgaAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        const message = `@${attr.name.id} takes a target triple ARCH-FAMILY-PACKAGE.`
        if (!validateParameters(logger, attr, message, [AstLiteralType.String])) {
            return false
        }
        let arr = (attr.parameters[0].value as IAstLiteral).value.split('-')
        if (arr.length !== 3) {
            logger.error(`Invalid target triple.`, attr.parameters[0].value.src)
            return false
        }
        return true
    },

    compile(attr: IAstAttribute): IAttr[] {
        return [ Attr('fpga', param2value(attr.parameters[0]), attr.name.src) ]
    }
}

const BitstreamAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        // TODO
        return true
    },

    compile(attr: IAstAttribute): IAttr[] {
        return []
    }
}

const SetIoAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: IAstAttribute): boolean {
        // TODO
        return true
    },

    compile(attr: IAstAttribute): IAttr[] {
        return []
    }
}

export const allAttributes: {[name: string]: IAttributeHandler} = {
    // Schematic
    rotate: RotateAttribute,
    left: LeftAttribute,
    right: RightAttribute,
    top: TopAttribute,
    bottom: BottomAttribute,
    group: GroupAttribute,
    power: PowerAttribute,
    ground: GroundAttribute,
    // RTL
    clock: ClockAttribute,
    // BOM
    bom: BomAttribute,
    // Simulation
    model: ModelAttribute,
    // PCB
    set_pad: SetPadAttribute,
    // Bitstream
    fpga: FpgaAttribute,
    bitstream: BitstreamAttribute,
    set_io: SetIoAttribute,
}
