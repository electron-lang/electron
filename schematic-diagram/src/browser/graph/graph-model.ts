import { SModelElementSchema, SNodeSchema, RectangularNode,
         SPortSchema, SPort, SEdgeSchema, SEdge,
         openFeature, Point, add } from 'sprotty/lib'
import * as urn from './urn'

export type Orientation = 0 | 90 | 180 | 270
export type Side = 'top' | 'left' | 'bottom' | 'right'

export interface ILink {
    link: urn.URN
}

export interface SrcLoc {
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number,
}

export interface Traceable {
    trace?: SrcLoc
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

function computeOrientOffset(orient: Orientation, point: Point): Point {
    switch(orient) {
        case 0:
            return {x: point.x, y: point.y}
        case 90:
            return {x: point.y, y: point.x}
        case 180:
            return {x: -point.x, y: point.y}
        case 270:
            return {x: point.y, y: -point.x}
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
    type = 'node:file'
    hidden = true
}
/* File Node */

/* Module Node */
export interface ModuleNodeSchema extends SNodeSchema, Traceable {
    urn: urn.Module
    type: 'node:module'
    hidden: boolean
}

export function isModule(element?: SModelElementSchema)
: element is ModuleNodeSchema {
    return element !== undefined && element.type === 'node:module'
}

export class ModuleNode extends RectangularNode implements Traceable {
    type = 'node:module'
    hidden = true
    trace = undefined
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
    type = 'node:schematic'
    hidden = true
}
/* Schematic Node */

/* Group Node */
export interface GroupNodeSchema extends SNodeSchema, ILink {
    urn: urn.SymGroup | urn.CellGroup
    type: 'node:group'
    ntop: number
    nleft: number
    nbottom: number
    nright: number
    skin: boolean
    orient: Orientation
}

export function isGroup(element?: SModelElementSchema)
: element is GroupNodeSchema {
    return element !== undefined && element.type === 'node:group'
}

export class GroupNode extends RectangularNode {
    urn: urn.SymGroup | urn.CellGroup =
        urn.SymGroup(urn.Symbol(urn.Module(urn.File(''), '')), '')
    type = 'node:group'
    ntop: number = 0
    nleft: number = 0
    nbottom: number = 0
    nright: number = 0
    skin: boolean = false
    orient: Orientation = 0

    hasFeature(feature: symbol): boolean {
        if (feature === openFeature) {
            return true
        }
        return super.hasFeature(feature)
    }

}
/* Group Node */

/* Pin Port */
export interface PinPortSchema extends SPortSchema, Traceable {
    urn: urn.SymPort
    type: 'port:pin'
    side: Side
    pad: string
    fixed: boolean
    groupId?: string
    padPin: number
}

export class PinPort extends SPort implements Traceable {
    urn = urn.SymPort(urn.SymGroup(urn.Symbol(urn.Module(urn.File(''), '')), ''), '')
    type = 'port:pin'
    side: Side = 'left'
    pad = ''
    fixed = false
    trace = undefined
    padPin = 0

    getAnchor(referencePoint: Point, offset?: number): Point {
        const anchor = {x: this.bounds.x, y: this.bounds.y}
        const sideOffset = (() => {
            switch(this.side) {
                case 'top':
                    return {x: 0, y: 20}
                case 'left':
                    return {x: -20, y: 0}
                case 'bottom':
                    return {x: 0, y: -20}
                case 'right':
                    return {x: 20, y: 0}
            }
        })()
        const newAnchor = add(anchor, sideOffset)
        const groupNode = this.parent as GroupNode
        return computeOrientOffset(groupNode.orient, newAnchor)
    }
}

export function isPin(element?: SModelElementSchema)
: element is PinPortSchema {
    return element !== undefined && element.type === 'port:pin'
}
/* Pin Port */

/* Port Node */
export interface PortNodeSchema extends SNodeSchema, Traceable, ILink {
    urn: urn.Port
    type: 'node:port'
    orient: Orientation
}

export class PortNode extends RectangularNode implements Traceable {
    urn = urn.Port(urn.Schematic(urn.Module(urn.File(''), '')), '')
    type = 'node:port'
    orient: Orientation = 0
    trace = undefined

    hasFeature(feature: symbol): boolean {
        if (feature === openFeature) {
            return true
        }
        return super.hasFeature(feature)
    }

    getAnchor(referencePoint: Point, offset?: number): Point {
        const orientOffset = computeOrientOffset(this.orient, {x: 30, y: 10})
        return add({x: this.bounds.x, y: this.bounds.y}, orientOffset)
    }
}

export function isPort(element?: SModelElementSchema)
: element is PortNodeSchema {
    return element !== undefined && element.type === 'node:port'
}
/* Port Node */

/* Cell Node */
export interface CellNodeSchema extends SNodeSchema, Traceable {
    urn: urn.Cell
    type: 'node:cell'
}

export class CellNode extends RectangularNode implements Traceable {
    type = 'node:cell'
    trace = undefined
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
    type = 'edge:net'
}
/* Edge Net */
