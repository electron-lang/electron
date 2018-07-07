import { SModelElementSchema, SNodeSchema, SPortSchema, SEdgeSchema,
         RectangularNode, SEdge, SPort, openFeature } from 'sprotty/lib'

export interface GroupNodeSchema extends SNodeSchema {
    name: string
    ntop: number
    nleft: number
    nbottom: number
    nright: number
}

export function isGroup(element?: SModelElementSchema)
: element is GroupNodeSchema {
    return element !== undefined && element.type === 'node:group'
}

export class GroupNode extends RectangularNode {
    name: string = ''
    ntop: number = 0
    nleft: number = 0
    nbottom: number = 0
    nright: number = 0

    hasFeature(feature: symbol): boolean {
        if (feature === openFeature) {
            return true
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
    name: string = ''
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
