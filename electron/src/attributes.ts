import { IAstAttribute } from './ast'
import { IDiagnostic } from './diagnostic'
import { IAttrs } from '@electron-lang/celllib'

export interface IAttributeHandler {
    validateParameters(attr: IAstAttribute): IDiagnostic[]
    generateJson(attr: IAstAttribute): IAttrs
}

/* Attributes for Schematic generation */
const RotateAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const LeftAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const RightAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const TopAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const BottomAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const GroupAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const PowerAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const GroundAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

/* Attributes for RTL */
const ClockAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

/* Attributes for BOM generation */
const BomAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

/* Attributes for Simulation */
const ModelAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

/* Attributes for PCB generation */
const SetPadAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

/* Attributes for FPGA bitstream generation */
const FpgaAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const BitstreamAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const SetIoAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
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
