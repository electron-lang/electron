export type URN = File | Module | Symbol | Schematic |
    SymGroup | SymPort | Port | Cell | Net

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

export function Net(urn: Schematic, netName: string): Net {
    return {
        tag: 'schematic-net',
        urn,
        netName
    }
}
