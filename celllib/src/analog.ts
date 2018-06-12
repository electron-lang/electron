import {IAnalogCell, IAnalogParams, AnalogVector, AnalogValue} from './common';

export interface IResParams extends IAnalogParams {
    RESISTANCE: string,
    POWER_RATING?: string,
}

export interface IRes extends IAnalogCell {
    type: '$res',
    parameters: IResParams,
    connections: {
        A: AnalogVector,
        B: AnalogVector,
    }
}

export interface ICapParams extends IAnalogParams {
    CAPACITANCE: string,
    POLARIZED?: boolean,
    VOLTAGE_RATING?: string,
    DIELECTRIC?: string,
    // Initial condition transient simulation
    IC?: number,
}

export interface ICap extends IAnalogCell {
    type: '$cap',
    parameters: ICapParams,
    connections: {
        A: AnalogVector,
        B: AnalogVector,
    }
}

export interface IIndParams extends IAnalogParams {
    INDUCTANCE: string,
    // Inital condition transient simulation
    IC: number,
}

export interface IInd extends IAnalogCell {
    type: '$ind',
    parameters: IIndParams,
    connections: {
        A: AnalogVector,
        B: AnalogVector,
    }
}

export interface IMindParams extends IAnalogParams {
    L1_VALUE: string,
    L2_VALUE: string,
    L1_REVERSE: boolean,
    L2_REVERSE: boolean,
    K: number,
}

export interface IMind extends IAnalogCell {
    type: '$mind',
    parameters: IMindParams,
    connections: {
        L1_A: [AnalogValue],
        L1_B: [AnalogValue],
        L2_A: [AnalogValue],
        L2_B: [AnalogValue],
    }
}

export interface IVcs extends IAnalogCell {
    type: '$vcs',
    parameters: IAnalogParams,
    connections: {
        S_A: AnalogVector,
        S_B: AnalogVector,
        A: AnalogVector,
        B: AnalogVector,
    }
}

export enum TransientWaveType {
    Sin = 'sin',
    Pulse = 'pulse',
    Exp = 'exp',
    Sffm = 'sffm',
    Am = 'am',
}

export interface IVsParams extends IAnalogParams {
    VDC: number,
    VAC: number,
    TTYPE: TransientWaveType,
}

export interface IVs extends IAnalogCell {
    type: '$vs',
    parameters: IVsParams,
    connections: {
        A: AnalogVector,
        B: AnalogVector,
    }
}

export interface IIsParams extends IAnalogParams {
    IDC: number,
    IAC: number,
    TTYPE: TransientWaveType,
}

export interface IIs extends IAnalogCell {
    type: '$is',
    parameters: IIsParams,
    connections: {
        A: AnalogVector,
        B: AnalogVector,
    }
}

export interface IDependentSourceCellParams extends IAnalogParams {
    VALUE: number
}

export interface IDependentSourceCell {
    parameters: IDependentSourceCellParams,
    connections: {
        S_A: AnalogVector,
        S_B: AnalogVector,
        A: AnalogVector,
        B: AnalogVector,
    }
}

export interface IVcvs extends IDependentSourceCell {
    type: '$vcvs'
}

export interface IVccs extends IDependentSourceCell {
    type: '$vcvs'
}

export interface ICccs extends IDependentSourceCell {
    type: '$vcvs'
}

export interface IDiode extends IAnalogCell {
    type: '$diode',
    parameters: IAnalogParams,
    connections: {
        A: AnalogVector,
        K: AnalogVector,
    }
}

export interface IMos extends IAnalogCell {
    type: '$mos',
    parameters: IAnalogParams,
    connections: {
        D: AnalogVector,
        G: AnalogVector,
        S: AnalogVector,
        B: AnalogVector,
    }
}
