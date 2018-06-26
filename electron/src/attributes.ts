import * as ast from './ast'
import { DiagnosticPublisher, emptySrcLoc } from './diagnostic'
import * as ir from './backend/ir'

export interface IAttributeHandler {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean
    compile(attr: ast.IAttr): ir.IAttr[]
}

function validateParams(logger: DiagnosticPublisher, attr: ast.IAttr,
                            message: string, tys: string[]): boolean {
    let ok = true
    // No params and not enough parameters
    if (attr.params.length < 1 && tys.length > 0 ||
        attr.params.length < tys.length) {
        logger.error(message, attr.name.src)
        ok = false
    }
    // Check each supplied parameter
    for (let i = 0; i < attr.params.length; i++) {
        let param = attr.params[i]
        if (!(i < tys.length)) {
            logger.error(message, param.value.src)
            ok = false
            continue
        }
        const lit = param.value
        if (lit.tag !== tys[i]) {
            logger.error(message, param.value.src)
            ok = false
        }
    }
    return ok
}

/* Attributes for Schematic generation */
const RotateAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        let message = `'@${attr.name.id}' takes one parameter of type Integer\n` +
            ` - allowed values are 0, 90, 180, 270`

        if (!validateParams(logger, attr, message, ['integer'])) {
            return false
        }

        const angle = (attr.params[0].value) as ast.IInteger
        switch(angle.value) {
            case 0:
            case 90:
            case 180:
            case 270:
                break
            default:
                logger.error(message, angle.src)
                return false
        }
        return true
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        const angle = attr.params[0].value as ast.IInteger
        return [
            ir.Attr('rotate', angle.value.toString(), attr.name.src)
        ]
    }
}

const LeftAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        const message = `@${attr.name.id} takes no params.`
        return validateParams(logger, attr, message, [])
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        return [ ir.Attr('side', 'left', attr.name.src) ]
    }
}

const RightAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        const message = `@${attr.name.id} takes no params.`
        return validateParams(logger, attr, message, [])
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        return [ ir.Attr('side', 'right', attr.name.src) ]
    }
}

const TopAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        const message = `@${attr.name.id} takes no params.`
        return validateParams(logger, attr, message, [])
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        return [ ir.Attr('side', 'top', attr.name.src) ]
    }
}

const BottomAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        const message = `@${attr.name.id} takes no params.`
        return validateParams(logger, attr, message, [])
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        return [ ir.Attr('side', 'bottom', attr.name.src) ]
    }
}

const GroupAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        const message = `@${attr.name.id} takes one parameter of type String.`
        return validateParams(logger, attr, message, ['string'])
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        const group = attr.params[0].value as ast.IString
        return [ ir.Attr('group', group.value, attr.name.src) ]
    }
}

const PowerAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        const message = `@${attr.name.id} takes no params.`
        return validateParams(logger, attr, message, [])
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        return [ ir.Attr('splitnet', '$vcc', attr.name.src) ]
    }
}

const GroundAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        const message = `@${attr.name.id} takes no params.`
        return validateParams(logger, attr, message, [])
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        return [ ir.Attr('splitnet', '$gnd', attr.name.src) ]
    }
}

/* Attributes for RTL */
const ClockAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        const message = `@${attr.name.id} takes no params.`
        return validateParams(logger, attr, message, [])
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        // TODO
        return []
    }
}

/* Attributes for BOM generation */
const BomAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        const message = `@${attr.name.id} takes two params of type String.`
        return validateParams(logger, attr, message,
                              ['string', 'string'])
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        const man = attr.params[0].value as ast.IString
        const mpn = attr.params[1].value as ast.IString
        return [
            ir.Attr('man', man.value, man.src),
            ir.Attr('mpn', mpn.value, mpn.src)
        ]
    }
}

/* Attributes for Simulation */
const ModelAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        // TODO
        return true
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        return []
    }
}

/* Attributes for PCB generation */
const SetPadAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        // TODO
        return true
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        return []
    }
}

/* Attributes for FPGA bitstream generation */
const FpgaAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        const message = `@${attr.name.id} takes a target triple ARCH-FAMILY-PACKAGE.`
        if (!validateParams(logger, attr, message, ['string'])) {
            return false
        }
        const fpga = attr.params[0].value as ast.IString
        let arr = fpga.value.split('-')
        if (arr.length !== 3) {
            logger.error(`Invalid target triple.`, fpga.src)
            return false
        }
        return true
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        const fpga = attr.params[0].value as ast.IString
        return [ ir.Attr('fpga', fpga.value, attr.name.src) ]
    }
}

const BitstreamAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        // TODO
        return true
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
        return []
    }
}

const SetIoAttribute: IAttributeHandler = {
    validate(logger: DiagnosticPublisher, attr: ast.IAttr): boolean {
        // TODO
        return true
    },

    compile(attr: ast.IAttr): ir.IAttr[] {
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
