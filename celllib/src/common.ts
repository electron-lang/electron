// Netlist definitions
export interface INetlist {
    modules: IModules
}

export interface IModules {
    [name: string]: IModule
}

export interface IModule {
    attributes: IAttrs
    ports: IPorts
    cells: ICells
    netnames: INets
}

export interface IPorts {
    [name: string]: IPort
}

export interface IPort {
    attributes?: IAttrs
    direction: PortDirection
    bits: Vector
}

export interface INets {
    [net_name: string]: INet
}

export interface INet {
    attributes?: IAttrs
    hide_name?: 0 | 1
    bits: Vector
}

export interface ICells {
    [cell_name: string]: ICell
}

// Generic cell definitions
export interface ICell {
    hide_name?: 0 | 1
    type: string
    attributes?: IAttrs
    parameters: IParams
    connections: IConnections
}

export interface IAttrs {
    [attribute_name: string]: any
}

export interface IParams {
    [parameter_name: string]: any
}

export interface IConnections {
    [port_name: string]: Vector
}

export type Vector = DigitalVector | AnalogVector;

export interface ISrcAttribute {
    src?: string
}

// Digital cell definitions
export interface IDigitalCell extends ICell {
    attributes?: IDigitalAttrs
    parameters: IDigitalParams
    port_directions: IPortDirections
    connections: IDigitalConnections
}

export interface IDigitalAttrs extends IAttrs, ISrcAttribute {}
export interface IDigitalParams extends IParams {}
export interface IDigitalConnections extends IConnections {
    [port_name: string]: DigitalVector
}

export interface IPortDirections {
    [port_name: string]: PortDirection
}

export type PortDirection = 'input' | 'output' | 'inout' | 'analog'
export type BitConstant = '0' | '1' | 'x' | 'z'

export type DigitalValue = BitConstant | number
export type DigitalVector = DigitalValue[]


// Analog cell definitions
export interface IAnalogCell extends ICell {
    attributes?: IAnalogAttrs
    parameters: IAnalogParams
    // port_directions don't make sense since all are inout
    connections: IAnalogConnections
}

export interface IAnalogAttrs extends IAttrs, ISrcAttribute, IOrientationAttribute {}

export interface IAnalogParams {
    // Width of devices in parallel (match device, share model,
    // resistor arrays, etc.)
    WIDTH?: number
    // Module name of simulation model, if none is provided the default spice
    // model will be used.
    MODEL?: string
    // Manufacturer
    MAN?: string
    // Manufacturer Part Number
    MPN?: string
    // Part count (if WIDTH=9 and MAN/MPN is a resistor array size 10 COUNT=1)
    PCOUNT?: number
    // Package name
    PACKAGE?: string
    // Kicad module name
    KICAD_MODULE?: string
}

export interface IAnalogConnections {
    [port_name: string]: AnalogVector
}

export type AnalogValue = number
export type AnalogVector = AnalogValue[]

export enum Orientation {
    Rot0 = 0,
    Rot90 = 1,
    Rot180 = 2,
    Rot270 = 3,
}

export interface IOrientationAttribute {
    orientation?: Orientation
}
