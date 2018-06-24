import { Ast, IAstAttribute, IAstLiteral, AstLiteralType } from './ast'
import { DiagnosticPublisher } from './diagnostic'
import { IAttrs } from '@electron-lang/celllib'

export interface IAttributeHandler {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void
    generateJson(attr: IAstAttribute): IAttrs
}

function validateParameters(logger: DiagnosticPublisher, attr: IAstAttribute,
                            message: string, tys: AstLiteralType[]): boolean {
    let errors = false
    // No parameters and not enough parameters
    if (attr.parameters.length < 1 && tys.length > 0 ||
        attr.parameters.length < tys.length) {
        logger.error(message, attr.name.src)
        errors = true
    }
    // Check each supplied parameter
    for (let i = 0; i < attr.parameters.length; i++) {
        let param = attr.parameters[i]
        if (!(i < tys.length) || param.value.ast !== Ast.Literal) {
            logger.error(message, param.value.src)
            errors = true
            continue
        }
        const lit = param.value
        if (lit.litType !== tys[i]) {
            logger.error(message, param.value.src)
            errors = true
        }
    }
    return errors
}

/* Attributes for Schematic generation */
const RotateAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        let message = `'@${attr.name.id}' takes one parameter of type Integer\n` +
            ` - allowed values are 0, 90, 180, 270`

        if (!validateParameters(logger, attr, message, [AstLiteralType.Integer])) {
            const value = ((attr.parameters[0].value) as IAstLiteral).value
            switch(value) {
                case '0':
                case '90':
                case '180':
                case '270':
                    break
                default:
                    logger.error(message, attr.parameters[0].value.src)
            }
        }
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const LeftAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        const message = `@${attr.name.id} takes no parameters.`
        validateParameters(logger, attr, message, [])
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const RightAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        const message = `@${attr.name.id} takes no parameters.`
        validateParameters(logger, attr, message, [])
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const TopAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        const message = `@${attr.name.id} takes no parameters.`
        validateParameters(logger, attr, message, [])
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const BottomAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        const message = `@${attr.name.id} takes no parameters.`
        validateParameters(logger, attr, message, [])
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const GroupAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        const message = `@${attr.name.id} takes one parameter of type String.`
        validateParameters(logger, attr, message, [AstLiteralType.String])
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const PowerAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        const message = `@${attr.name.id} takes no parameters.`
        validateParameters(logger, attr, message, [])
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const GroundAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        const message = `@${attr.name.id} takes no parameters.`
        validateParameters(logger, attr, message, [])
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

/* Attributes for RTL */
const ClockAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        const message = `@${attr.name.id} takes no parameters.`
        validateParameters(logger, attr, message, [])
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

/* Attributes for BOM generation */
const BomAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        const message = `@${attr.name.id} takes two parameters of type String.`
        validateParameters(logger, attr, message,
                           [AstLiteralType.String, AstLiteralType.String])
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

/* Attributes for Simulation */
const ModelAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        // TODO
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

/* Attributes for PCB generation */
const SetPadAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        // TODO
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

/* Attributes for FPGA bitstream generation */
const FpgaAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        const message = `@${attr.name.id} takes a target triple ARCH-FAMILY-PACKAGE.`
        if (!validateParameters(logger, attr, message, [AstLiteralType.String])) {
            let arr = (attr.parameters[0].value as IAstLiteral).value.split('-')
            if (arr.length !== 3) {
                logger.error(`Invalid target triple.`, attr.parameters[0].value.src)
            }
        }
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const BitstreamAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        // TODO
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const SetIoAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute, logger: DiagnosticPublisher): void {
        // TODO
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
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
