declare module 'electro-grammar' {
    export type Component = IResistor | ICapacitor | ILED | { type: undefined }

    export interface IResistor {
        type: 'resistor'
        resistance: string
        size?: string
        tolerance?: number
        power_rating?: number
    }

    export interface ICapacitor {
        type: 'capacitor'
        capacitance: number
        size?: string
        characteristic?: string
        tolearance?: number
        voltage_rating?: number
    }

    export interface ILED {
        type: 'led'
        color?: string
        size?: string
    }

    export function parse(eg: string): Component;
    export function matchCPL(comp: Component): string[];
}
