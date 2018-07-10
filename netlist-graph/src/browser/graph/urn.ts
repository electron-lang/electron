export type URN = File | Module | Symbol | Schematic |
    SymGroup | SymPort | Port | Cell | CellGroup | CellPort | Net

export interface File {
    tag: 'file'
    uri: string
}

export interface Module {
    tag: 'module'
    urn: File
    modName: string
}

export interface Symbol {
    tag: 'symbol'
    urn: Module
}

export interface Schematic {
    tag: 'schematic'
    urn: Module
}

export interface SymGroup {
    tag: 'symbol-group'
    urn: Symbol
    groupName: string
}

export interface SymPort {
    tag: 'symbol-port'
    urn: SymGroup
    portName: string
}

export interface Port {
    tag: 'schematic-port'
    urn: Schematic
    portName: string
}

export interface Cell {
    tag: 'schematic-cell'
    urn: Schematic
    cellName: string
}

export interface CellGroup {
    tag: 'schematic-cell-group'
    urn: Cell
    groupName: string
}

export interface CellPort {
    tag: 'schematic-cell-port'
    urn: Cell
    portName: string
}

export interface Net {
    tag: 'schematic-net'
    urn: Schematic
    netName: string
}

export function toString(urn: URN): string {
    switch(urn.tag) {
        case 'file':
            return urn.uri
        case 'module':
            return toString(urn.urn) + ':' + urn.modName
        case 'symbol':
            return toString(urn.urn) + ':symbol'
        case 'symbol-group':
            return toString(urn.urn) + ':' + urn.groupName
        case 'symbol-port':
            return toString(urn.urn) + ':' + urn.portName
        case 'schematic':
            return toString(urn.urn) + ':schematic'
        case 'schematic-port':
            return toString(urn.urn) + ':' + urn.portName
        case 'schematic-cell':
            return toString(urn.urn) + ':' + urn.cellName
        case 'schematic-cell-group':
            return toString(urn.urn) + ':group:' + urn.groupName
        case 'schematic-cell-port':
            return toString(urn.urn) + ':port:' + urn.portName
        case 'schematic-net':
            return toString(urn.urn) + ':' + urn.netName
    }
}

export function File(uri: string): File {
    return {
        tag: 'file',
        uri,
    }
}

export function Module(urn: File, modName: string): Module {
    return {
        tag: 'module',
        urn,
        modName,
    }
}

export function Symbol(urn: Module): Symbol {
    return {
        tag: 'symbol',
        urn,
    }
}

export function Schematic(urn: Module): Schematic {
    return {
        tag: 'schematic',
        urn,
    }
}

export function SymGroup(urn: Symbol, groupName: string): SymGroup {
    return {
        tag: 'symbol-group',
        urn,
        groupName,
    }
}

export function SymPort(urn: SymGroup, portName: string): SymPort {
    return {
        tag: 'symbol-port',
        urn,
        portName
    }
}

export function Port(urn: Schematic, portName: string): Port {
    return {
        tag: 'schematic-port',
        urn,
        portName
    }
}

export function Cell(urn: Schematic, cellName: string): Cell {
    return {
        tag: 'schematic-cell',
        urn,
        cellName
    }
}

export function CellGroup(urn: Cell, groupName: string): CellGroup {
    return {
        tag: 'schematic-cell-group',
        urn,
        groupName
    }
}

export function CellPort(urn: Cell, portName: string): CellPort {
    return {
        tag: 'schematic-cell-port',
        urn,
        portName
    }
}

export function Net(urn: Schematic, netName: string): Net {
    return {
        tag: 'schematic-net',
        urn,
        netName
    }
}
