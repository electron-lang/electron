import { SModelElementSchema, SNodeSchema, SPortSchema, SEdgeSchema,
    RectangularNode, SEdge, SPort, layoutContainerFeature } from 'sprotty/lib'

export interface GroupNodeSchema extends SNodeSchema {
    name: string
}

export function isGroup(element?: SModelElementSchema)
: element is GroupNodeSchema {
    return element !== undefined && element.type === 'node:group'
}

export class GroupNode extends RectangularNode {
    name: string = ''

    hasFeature(feature: symbol): boolean {
        if (feature === layoutContainerFeature) {
            return false
        }
        return super.hasFeature(feature)
    }
}

export interface PortsNodeSchema extends SNodeSchema {}

export function isPorts(element?: SModelElementSchema)
: element is PortsNodeSchema {
    return element !== undefined && element.type === 'node:ports'
}

export class PortsNode extends RectangularNode {
    hasFeature(feature: symbol): boolean {
        if (feature === layoutContainerFeature) {
            return false
        }
        return super.hasFeature(feature)
    }
}

export interface PinPortSchema extends SPortSchema {
    side: 'top' | 'left' | 'right' | 'bottom'
    pad: string
}

export class PinPort extends SPort {
    side: 'top' | 'left' | 'right' | 'bottom' = 'left'
    pad: string = ''
}

export function isPin(element?: SModelElementSchema)
: element is PinPortSchema {
    return element !== undefined && element.type === 'port:pin'
}

export interface NetEdgeSchema extends SEdgeSchema {
    name?: string
}

export function isNet(element?: SModelElementSchema)
: element is NetEdgeSchema {
    return element !== undefined && element.type === 'edge:net'
}

export class NetEdge extends SEdge {

}



/*
export abstract class ChipyNode extends SNode {
    trace: string | undefined
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature || feature === hoverFeedbackFeature
            || (feature === openFeature && this.trace !== undefined)
            || feature === boundsFeature
    }
}

export class ChipyModule extends ChipyNode implements Expandable {
    expandable: boolean
    expanded: boolean

    hasFeature(feature: symbol): boolean {
        return feature === expandFeature || super.hasFeature(feature)
    }
}

export class ChipySymbol extends ChipyNode {}

export class ChipyNet extends SEdge {
    trace: string | undefined
}

export abstract class ChipyPort extends SPort {
    trace: string | undefined
}

export class TopPort extends ChipyPort {}
export class LeftPort extends ChipyPort {}
export class BottomPort extends ChipyPort {}
export class RightPort extends ChipyPort {}
export class FixedPort extends ChipyPort {}

export class ChipyModuleLabel extends SLabel {}
export class ChipyPortLabel extends SLabel {}
*/
