import { IAstAttribute } from './ast'
import { IDiagnostic } from './diagnostic'
import { IAttrs } from '@electron-lang/celllib'

export interface IAttributeHandler {
    validateParameters(attr: IAstAttribute): IDiagnostic[]
    generateJson(attr: IAstAttribute): IAttrs
}

const BomAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const RotateAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const ModelAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const ModuleAttribute: IAttributeHandler = {
    validateParameters(attr: IAstAttribute): IDiagnostic[] {
        return []
    },

    generateJson(attr: IAstAttribute): IAttrs {
        return {}
    }
}

const SetPadAttribute: IAttributeHandler = {
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
    bom: BomAttribute,
    rotate: RotateAttribute,
    model: ModelAttribute,
    module: ModuleAttribute,
    set_pad: SetPadAttribute,
    set_io: SetIoAttribute,
}
