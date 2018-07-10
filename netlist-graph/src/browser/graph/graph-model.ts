import { SModelElementSchema, SNodeSchema, SPortSchema, SEdgeSchema,
         RectangularNode, SEdge, SPort, openFeature } from 'sprotty/lib'
import * as urn from './urn'

export type Orientation = 0 | 90 | 180 | 270
export type Side = 'top' | 'left' | 'bottom' | 'right'

export interface ILink {
    link: urn.URN
}

export function sideToOrientation(side: Side): Orientation {
    switch(side) {
        case 'top':
            return 90
        case 'left':
            return 0
        case 'bottom':
            return 270
        case 'right':
            return 180
    }
}

/* File Node */
export interface FileNodeSchema extends SNodeSchema {
    urn: urn.File
    hidden: boolean
}

export function isFile(element?: SModelElementSchema)
: element is FileNodeSchema {
    return element !== undefined && element.type === 'node:file'
}

export class FileNode extends RectangularNode {
    urn = urn.File('')
    hidden = true
}
/* File Node */

/* Module Node */
export interface ModuleNodeSchema extends SNodeSchema {
    urn: urn.Module
    hidden: boolean
}

export function isModule(element?: SModelElementSchema)
: element is ModuleNodeSchema {
    return element !== undefined && element.type === 'node:module'
}

export class ModuleNode extends RectangularNode {
    urn = urn.Module(urn.File(''), '')
    hidden = true
    state: 'symbol' | 'schematic' = 'symbol'
}
/* Module Node */

/* Symbol Node */
export interface SymbolNodeSchema extends SNodeSchema {
    urn: urn.Symbol
    hidden: boolean
}

export function isSymbol(element?: SModelElementSchema)
: element is SymbolNodeSchema {
    return element !== undefined && element.type === 'node:symbol'
}

export class SymbolNode extends RectangularNode {
    urn = urn.Symbol(urn.Module(urn.File(''), ''))
    hidden = true
}
/* Symbol Node */

/* Schematic Node */
export interface SchematicNodeSchema extends SNodeSchema {
    urn: urn.Schematic
    hidden: boolean
}

export function isSchematic(element?: SModelElementSchema)
: element is SchematicNodeSchema {
    return element !== undefined && element.type === 'node:schematic'
}

export class SchematicNode extends RectangularNode {
    urn = urn.Schematic(urn.Module(urn.File(''), ''))
    hidden = true
}
/* Schematic Node */

/* Group Node */
export interface GroupNodeSchema extends SNodeSchema, ILink {
    urn: urn.SymGroup
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
    urn = urn.SymGroup(urn.Symbol(urn.Module(urn.File(''), '')), '')
    ntop: number = 0
    nleft: number = 0
    nbottom: number = 0
    nright: number = 0
    link: urn.URN = urn.File('')

    hasFeature(feature: symbol): boolean {
        if (feature === openFeature) {
            return true
        }
        return super.hasFeature(feature)
    }

}
/* Group Node */

/* Pin Port */
export interface PinPortSchema extends SPortSchema {
    urn: urn.SymPort
    side: Side
    pad: string
}

export class PinPort extends SPort {
    urn = urn.SymPort(urn.SymGroup(urn.Symbol(urn.Module(urn.File(''), '')), ''), '')
    side: Side = 'left'
    pad: string = ''
}

export function isPin(element?: SModelElementSchema)
: element is PinPortSchema {
    return element !== undefined && element.type === 'port:pin'
}
/* Pin Port */

/* Port Node */
export interface PortNodeSchema extends SNodeSchema, ILink {
    urn: urn.Port
    orient: Orientation
}

export class PortNode extends RectangularNode {
    urn = urn.Port(urn.Schematic(urn.Module(urn.File(''), '')), '')
    orient: Orientation = 0
    link: urn.URN = urn.File('')
}

export function isPort(element?: SModelElementSchema)
: element is PortNodeSchema {
    return element !== undefined && element.type === 'node:port'
}
/* Port Node */

/* Edge Net */
export interface NetEdgeSchema extends SEdgeSchema {
    urn: urn.Net
}

export function isNet(element?: SModelElementSchema)
: element is NetEdgeSchema {
    return element !== undefined && element.type === 'edge:net'
}

export class NetEdge extends SEdge {
    urn = urn.Net(urn.Schematic(urn.Module(urn.File(''), '')), '')
}
/* Edge Net */
