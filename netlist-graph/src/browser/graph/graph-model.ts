import { SModelElementSchema, SNodeSchema, SPortSchema, SEdgeSchema,
         RectangularNode, SEdge, SPort, openFeature,
         Point, add } from 'sprotty/lib'
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
    type: 'node:file'
    hidden: boolean
}

export function isFile(element?: SModelElementSchema)
: element is FileNodeSchema {
    return element !== undefined && element.type === 'node:file'
}

export class FileNode extends RectangularNode {
    urn = urn.File('')
    type = 'node:file'
    hidden = true
}
/* File Node */

/* Module Node */
export interface ModuleNodeSchema extends SNodeSchema {
    urn: urn.Module
    type: 'node:module'
    hidden: boolean
}

export function isModule(element?: SModelElementSchema)
: element is ModuleNodeSchema {
    return element !== undefined && element.type === 'node:module'
}

export class ModuleNode extends RectangularNode {
    urn = urn.Module(urn.File(''), '')
    type = 'node:module'
    hidden = true
    state: 'symbol' | 'schematic' = 'symbol'
}
/* Module Node */

/* Symbol Node */
export interface SymbolNodeSchema extends SNodeSchema {
    urn: urn.Symbol
    type: 'node:symbol'
    hidden: boolean
}

export function isSymbol(element?: SModelElementSchema)
: element is SymbolNodeSchema {
    return element !== undefined && element.type === 'node:symbol'
}

export class SymbolNode extends RectangularNode {
    urn = urn.Symbol(urn.Module(urn.File(''), ''))
    type = 'node:symbol'
    hidden = true
}
/* Symbol Node */

/* Schematic Node */
export interface SchematicNodeSchema extends SNodeSchema {
    urn: urn.Schematic
    type: 'node:schematic'
    hidden: boolean
}

export function isSchematic(element?: SModelElementSchema)
: element is SchematicNodeSchema {
    return element !== undefined && element.type === 'node:schematic'
}

export class SchematicNode extends RectangularNode {
    urn = urn.Schematic(urn.Module(urn.File(''), ''))
    type = 'node:schematic'
    hidden = true
}
/* Schematic Node */

/* Group Node */
export interface GroupNodeSchema extends SNodeSchema, ILink {
    urn: urn.SymGroup
    type: 'node:group'
    ntop: number
    nleft: number
    nbottom: number
    nright: number
    skin: boolean
}

export function isGroup(element?: SModelElementSchema)
: element is GroupNodeSchema {
    return element !== undefined && element.type === 'node:group'
}

export class GroupNode extends RectangularNode {
    urn = urn.SymGroup(urn.Symbol(urn.Module(urn.File(''), '')), '')
    type = 'node:group'
    ntop: number = 0
    nleft: number = 0
    nbottom: number = 0
    nright: number = 0
    skin: boolean = false
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
    type: 'port:pin'
    side: Side
    pad: string
    fixed: boolean
}

export class PinPort extends SPort {
    urn = urn.SymPort(urn.SymGroup(urn.Symbol(urn.Module(urn.File(''), '')), ''), '')
    type = 'port:pin'
    side: Side = 'left'
    pad = ''
    fixed = false

    getAnchor(referencePoint: Point, offset?: number): Point {
        const anchor = {x: this.bounds.x, y: this.bounds.y}
        const sideOffset = {x: 0, y: 0}
            /*(() => {
            switch(this.orient) {
                case 0:
                    return {x: 30, y: 10}
                case 90:
                    return {x: -10, y: 30}
                case 180:
                    return {x: -30, y: 10}
                case 270:
                    return {x: 10, y: -30}
            }
        })()*/
        return add(anchor, sideOffset)
    }
}

export function isPin(element?: SModelElementSchema)
: element is PinPortSchema {
    return element !== undefined && element.type === 'port:pin'
}
/* Pin Port */

/* Port Node */
export interface PortNodeSchema extends SNodeSchema, ILink {
    urn: urn.Port
    type: 'node:port'
    orient: Orientation
}

export class PortNode extends RectangularNode {
    urn = urn.Port(urn.Schematic(urn.Module(urn.File(''), '')), '')
    type = 'node:port'
    orient: Orientation = 0

    hasFeature(feature: symbol): boolean {
        if (feature === openFeature) {
            return true
        }
        return super.hasFeature(feature)
    }

    getAnchor(referencePoint: Point, offset?: number): Point {
        const anchor = {x: this.bounds.x, y: this.bounds.y}
        const orientOffset = (() => {
            switch(this.orient) {
                case 0:
                    return {x: 30, y: 10}
                case 90:
                    return {x: -10, y: 30}
                case 180:
                    return {x: -30, y: 10}
                case 270:
                    return {x: 10, y: -30}
            }
        })()
        return add(anchor, orientOffset)
    }
}

export function isPort(element?: SModelElementSchema)
: element is PortNodeSchema {
    return element !== undefined && element.type === 'node:port'
}
/* Port Node */

/* Cell Node */
export interface CellNodeSchema extends SNodeSchema {
    urn: urn.Cell
    type: 'node:cell'
    orient: Orientation
}

export class CellNode extends RectangularNode {
    urn = urn.Cell(urn.Schematic(urn.Module(urn.File(''), '')), '')
    type = 'node:cell'
    orient: Orientation = 0
}

export function isCell(element?: SModelElementSchema)
: element is CellNodeSchema {
    return element !== undefined && element.type === 'node:cell'
}
/* Cell Node */

/* Edge Net */
export interface NetEdgeSchema extends SEdgeSchema {
    type: 'edge:net'
    label?: string
}

export function isNet(element?: SModelElementSchema)
: element is NetEdgeSchema {
    return element !== undefined && element.type === 'edge:net'
}

export class NetEdge extends SEdge {
    urn = urn.Net(urn.Schematic(urn.Module(urn.File(''), '')), '')
    type = 'edge:net'
}
/* Edge Net */
