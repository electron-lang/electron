import { SModelElementSchema, SNodeSchema, SEdgeSchema,
         RectangularNode, SEdge } from "sprotty/lib"

export interface NetlistModuleNodeSchema extends SNodeSchema {
    name: string
}

export function isNode(element?: SModelElementSchema)
: element is NetlistModuleNodeSchema {
    return element !== undefined && element.type === 'node'
}

export class NetlistModuleNode extends RectangularNode {
    name: string = ''
}

export interface NetlistNetEdgeSchema extends SEdgeSchema {
    name?: string
}

export function isEdge(element?: SModelElementSchema)
: element is NetlistNetEdgeSchema {
    return element !== undefined && element.type === 'edge'
}

export class NetlistNetEdge extends SEdge {

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
