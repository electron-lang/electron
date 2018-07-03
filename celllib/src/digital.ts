import {IDigitalCell, IDigitalParams, PortDirection,
        DigitalVector, DigitalValue} from './common';

// https://github.com/YosysHQ/yosys/blob/master/techlibs/common/simlib.v

export interface IUnaryCell extends IDigitalCell {
    parameters: {
        A_SIGNED: number,
        A_WIDTH: number,
        Y_WIDTH: number,
    },
    port_directions: {
        A: 'input',
        Y: 'output',
    },
    connections: {
        A: DigitalVector,
        Y: DigitalVector,
    }
}

export interface INot extends IUnaryCell {
    type: '$not'
}

export interface IPos extends IUnaryCell {
    type: '$pos'
}

export interface INeg extends IUnaryCell {
    type: '$neg'
}

export interface IReduceAnd extends IUnaryCell {
    type: '$reduce_and'
}

export interface IReduceOr extends IUnaryCell {
    type: '$reduce_or'
}

export interface IReduceXor extends IUnaryCell {
    type: '$reduce_xor'
}

export interface IReduceXnor extends IUnaryCell {
    type: '$reduce_xnor'
}

// An OR reduction. This cell type is used instead of $reduce_or when
// a signal is implicitly converted to a boolean signal, e.g. for
// operands of '&&' and '||'.
export interface IReduceBool extends IUnaryCell {
    type: '$reduce_bool'
}

export interface IBinaryCell extends IDigitalCell {
    parameters: {
        A_SIGNED: number,
        B_SIGNED: number,
        A_WIDTH: number,
        B_WIDTH: number,
        Y_WIDTH: number,
    },
    port_directions: {
        A: 'input',
        B: 'input',
        Y: 'output',
    },
    connections: {
        A: DigitalVector,
        B: DigitalVector,
        Y: DigitalVector,
    }
}

export interface IAnd extends IBinaryCell {
    type: '$and'
}

export interface IOr extends IBinaryCell {
    type: '$or'
}

export interface IXor extends IBinaryCell {
    type: '$xor'
}

export interface IXnor extends IBinaryCell {
    type: '$xnor'
}

export interface IShl extends IBinaryCell {
    type: '$shl'
}

export interface IShr extends IBinaryCell {
    type: '$shr'
}

export interface ISshl extends IBinaryCell {
    type: '$sshl'
}

export interface ISshr extends IBinaryCell {
    type: '$sshr'
}

export interface IShift extends IBinaryCell {
    type: '$shift'
}

export interface IShiftX extends IBinaryCell {
    type: '$shiftx'
}


export interface IFa extends IDigitalCell {
    type: '$fa',
    parameters: {
        WIDTH: number
    },
    port_directions: {
        A: 'input',
        B: 'input',
        C: 'input',
        X: 'output',
        Y: 'output',
    },
    connections: {
        A: DigitalVector,
        B: DigitalVector,
        C: DigitalVector,
        X: DigitalVector,
        Y: DigitalVector,
    }
}

export interface ILcu extends IDigitalCell {
    type: '$lcu',
    parameters: {
        WIDTH: number
    },
    port_directions: {
        P: 'input',
        G: 'input',
        CI: 'input',
        CO: 'output',
    },
    connections: {
        P: DigitalVector,
        G: DigitalVector,
        CI: DigitalVector,
        CO: DigitalVector,
    }
}

export interface IAlu extends IDigitalCell {
    type: '$alu',
    parameters: {
        A_SIGNED: number,
        B_SIGNED: number,
        A_WIDTH: number,
        B_WIDTH: number,
        Y_WIDTH: number
    },
    port_directions: {
        A: 'input',
        B: 'input',
        CI: 'input',
        BI: 'input',
        X: 'output',
        Y: 'output',
        CO: 'output',
    },
    connections: {
        A: DigitalVector,
        B: DigitalVector,
        CI: DigitalVector,
        BI: DigitalVector,
        X: DigitalVector,
        Y: DigitalVector,
        CO: DigitalVector,
    }
}

export interface ILt extends IBinaryCell {
    type: '$lt'
}

export interface ILe extends IBinaryCell {
    type: '$le'
}

export interface IEq extends IBinaryCell {
    type: '$eq'
}

export interface INe extends IBinaryCell {
    type: '$ne'
}

export interface IEqx extends IBinaryCell {
    type: '$eqx'
}

export interface INex extends IBinaryCell {
    type: '$nex'
}

export interface IGe extends IBinaryCell {
    type: '$ge'
}

export interface IGt extends IBinaryCell {
    type: '$gt'
}

export interface IAdd extends IBinaryCell {
    type: '$add'
}

export interface ISub extends IBinaryCell {
    type: '$sub'
}

export interface IMul extends IBinaryCell {
    type: '$mul'
}

export interface IMacc extends IDigitalCell {
    type: '$macc',
    parameters: {
        A_WIDTH: number,
        B_WIDTH: number,
        Y_WIDTH: number,
        CONFIG: number,
        CONFIG_WIDTH: number,
    },
    port_directions: {
        A: 'input',
        B: 'input',
        Y: 'output',
    },
    connections: {
        A: DigitalVector,
        B: DigitalVector,
        Y: DigitalVector,
    }
}

export interface IDiv extends IBinaryCell {
    type: '$div'
}

export interface IMod extends IBinaryCell {
    type: '$mod'
}

export interface IPow extends IBinaryCell {
    type: '$pow'
}

export interface ILogicNot extends IUnaryCell {
    type: '$logic_not'
}

export interface ILogicAnd extends IBinaryCell {
    type: '$logic_and'
}

export interface ILogicOr extends IBinaryCell {
    type: '$logic_or'
}

export interface ISlice extends IDigitalCell {
    type: '$slice',
    parameters: {
        OFFSET: number,
        A_WIDTH: number,
        Y_WIDTH: number,
    },
    port_directions: {
        A: 'input',
        Y: 'output',
    },
    connections: {
        A: DigitalVector,
        Y: DigitalVector,
    }
}

export interface IConcat extends IDigitalCell {
    type: '$concat',
    parameters: {
        A_WIDTH: number,
        B_WIDTH: number,
    },
    port_directions: {
        A: 'input',
        B: 'input',
        Y: 'output',
    },
    connections: {
        A: DigitalVector,
        B: DigitalVector,
        Y: DigitalVector,
    }
}

export interface IMux extends IDigitalCell {
    type: '$mux',
    parameters: {
        WIDTH: number,
    },
    port_directions: {
        A: 'input',
        B: 'input',
        S: 'input',
        Y: 'output',
    },
    connections: {
        A: DigitalVector,
        B: DigitalVector,
        S: DigitalVector,
        Y: DigitalVector,
    }
}

export interface IPMux extends IDigitalCell {
    type: '$pmux',
    parameters: {
        WIDTH: number,
    },
    port_directions: {
        A: 'input',
        B: 'input',
        S: 'input',
        Y: 'output',
    },
    connections: {
        A: DigitalVector,
        B: DigitalVector,
        S: DigitalVector,
        Y: DigitalVector,
    }
}

export interface ILut extends IDigitalCell {
    type: '$lut',
    parameters: {
        WIDTH: number,
        LUT: number,
    },
    port_directions: {
        A: 'input',
        Y: 'output',
    },
    connections: {
        A: DigitalVector,
        Y: DigitalVector,
    }
}

export interface ISop extends IDigitalCell {
    type: '$sop',
    parameters: {
        WIDTH: number,
        DEPTH: number,
        TABLE: number,
    },
    port_directions: {
        A: 'input',
        Y: 'output',
    },
    connections: {
        A: DigitalVector,
        Y: DigitalVector,
    }
}

export interface ITriBuf extends IDigitalCell {
    type: '$tribuf',
    parameters: {
        WIDTH: number,
    },
    port_directions: {
        A: 'input',
        EN: 'input',
        Y: 'output',
    },
    connections: {
        A: DigitalVector,
        EN: DigitalVector,
        Y: DigitalVector,
    }
}

export interface IFormalCheck extends IDigitalCell {
    parameters: {},
    port_directions: {
        A: 'input',
        EN: 'input',
    },
    connections: {
        A: [DigitalValue],
        EN: [DigitalValue],
    }
}

export interface IAssert extends IFormalCheck {
    type: '$assert'
}

export interface IAssume extends IFormalCheck {
    type: '$assume'
}

export interface ILive extends IFormalCheck {
    type: '$live'
}

export interface IFair extends IFormalCheck {
    type: '$fair'
}

export interface ICover extends IFormalCheck {
    type: '$cover'
}

export interface IInitState extends IDigitalCell {
    type: '$initstate',
    parameters: {},
    port_directions: {
        Y: 'output',
    },
    connections: {
        Y: [DigitalValue],
    }
}

export interface IFormalInput extends IDigitalCell {
    parameters: {
        WIDTH: number,
    },
    port_directions: {
        Y: 'output',
    },
    connections: {
        Y: DigitalVector,
    }
}

export interface IAnyConst extends IFormalInput {
    type: '$anyconst'
}

export interface IAnySeq extends IFormalInput {
    type: '$anyseq'
}

export interface IAllConst extends IFormalInput {
    type: '$allconst'
}

export interface IAllSeq extends IFormalInput {
    type: '$allseq'
}

export interface IEquiv extends IDigitalCell {
    type: '$equiv',
    parameters: {},
    port_directions: {
        A: 'input',
        B: 'input',
        Y: 'output',
    },
    connections: {
        A: [DigitalValue],
        B: [DigitalValue],
        Y: [DigitalValue],
    }
}

export interface ISr extends IDigitalCell {
    type: '$sr',
    parameters: {
        WIDTH: number,
        SET_POLARITY: number,
        CLR_POLARITY: number,
    },
    port_directions: {
        SET: 'input',
        CLR: 'input',
        Q: 'output',
    },
    connections: {
        SET: DigitalVector,
        CLR: DigitalVector,
        Q: DigitalVector,
    }
}

export interface IFf extends IDigitalCell {
    type: '$ff',
    parameters: {
        WIDTH: number,
    },
    port_directions: {
        D: 'input',
        Q: 'output',
    },
    connections: {
        D: DigitalVector,
        Q: DigitalVector,
    }
}

export interface IDff extends IDigitalCell {
    type: '$dff',
    parameters: {
        WIDTH: number,
        CLK_POLARITY: number,
    },
    port_directions: {
        CLK: 'input',
        D: 'input',
        Q: 'output',
    },
    connections: {
        CLK: [DigitalValue],
        D: DigitalVector,
        Q: DigitalVector,
    }
}

export interface IDffe extends IDigitalCell {
    type: '$dffe',
    parameters: {
        WIDTH: number,
        CLK_POLARITY: number,
        EN_POLARITY: number,
    },
    port_directions: {
        CLK: 'input',
        EN: 'input',
        D: 'input',
        Q: 'output',
    },
    connections: {
        CLK: [DigitalValue],
        EN: [DigitalValue],
        D: DigitalVector,
        Q: DigitalVector,
    }
}

export interface IDffSr extends IDigitalCell {
    type: '$dffsr',
    parameters: {
        WIDTH: number,
        CLK_POLARITY: number,
        SET_POLARITY: number,
        CLR_POLARITY: number,
    },
    port_directions: {
        CLK: 'input',
        SET: 'input',
        CLR: 'input',
        D: 'input',
        Q: 'output',
    },
    connections: {
        CLK: [DigitalValue],
        SET: [DigitalValue],
        CLR: [DigitalValue],
        D: DigitalVector,
        Q: DigitalVector,
    }
}

export interface IAdff extends IDigitalCell {
    type: '$adff',
    parameters: {
        WIDTH: number,
        CLK_POLARITY: number,
        ARST_POLARITY: number,
        ARST_VALUE: number,
    },
    port_directions: {
        CLK: 'input',
        ARST: 'input',
        D: 'input',
        Q: 'output',
    },
    connections: {
        CLK: [DigitalValue],
        ARST: [DigitalValue],
        D: DigitalVector,
        Q: DigitalVector,
    }
}

export interface IDlatch extends IDigitalCell {
    type: '$dlatch',
    parameters: {
        WIDTH: number,
        EN_POLARITY: number,
    },
    port_directions: {
        EN: 'input',
        D: 'input',
        Q: 'output',
    },
    connections: {
        EN: [DigitalValue],
        D: DigitalVector,
        Q: DigitalVector,
    }
}

export interface IDlatchSr extends IDigitalCell {
    type: '$dlatchsr',
    parameters: {
        WIDTH: number,
        EN_POLARITY: number,
        SET_POLARITY: number,
        CLR_POLARITY: number,
    },
    port_directions: {
        EN: 'input',
        SET: 'input',
        CLR: 'input',
        D: 'input',
        Q: 'output',
    },
    connections: {
        EN: [DigitalValue],
        SET: DigitalVector,
        CLR: DigitalVector,
        D: DigitalVector,
        Q: DigitalVector,
    }
}

export interface IFsm extends IDigitalCell {
    type: '$fsm',
    parameters: {
        NAME: string,
        CLK_POLARITY: number,
        ARST_POLARITY: number,
        CTRL_IN_WIDTH: number,
        CTRL_OUT_WIDTH: number,
        STATE_BITS: number,
        STATE_NUM: number,
        STATE_NUM_LOG2: number,
        STATE_RST: number,
        STATE_TABLE: number,
        TRANS_NUM: number,
        TRANS_TABLE: number,
    },
    port_directions: {
        CLK: 'input',
        ARST: 'input',
        CTRL_IN: 'input',
        CTRL_OUT: 'output',
    },
    connections: {
        CLK: [DigitalValue],
        ARST: [DigitalValue],
        CTRL_IN: DigitalVector,
        CTRL_OUT: DigitalVector,
    }
}

export interface IMemRd extends IDigitalCell {
    type: '$memrd',
    parameters: {
        MEMID: string,
        ABITS: number,
        WIDTH: number,
        CLK_ENABLE: number,
        CLK_POLARITY: number,
        TRANSPARENT: number,
    },
    port_directions: {
        CLK: 'input',
        EN: 'input',
        ADDR: 'input',
        DATA: 'output',
    },
    connections: {
        CLK: [DigitalValue],
        EN: [DigitalValue],
        ADDR: DigitalVector,
        DATA: DigitalVector,
    }
}

export interface IMemWr extends IDigitalCell {
    type: '$memwr',
    parameters: {
        MEMID: string,
        ABITS: number,
        WIDTH: number,
        CLK_ENABLE: number,
        CLK_POLARITY: number,
        PRIORITY: number,
    },
    port_directions: {
        CLK: 'input',
        EN: 'input',
        ADDR: 'input',
        DATA: 'input',
    },
    connections: {
        CLK: [DigitalValue],
        EN: DigitalVector,
        ADDR: DigitalVector,
        DATA: DigitalVector,
    }
}

export interface IMemInit extends IDigitalCell {
    type: '$meminit',
    parameters: {
        MEMID: string,
        ABITS: number,
        WIDTH: number,
        WORDS: number,
        PRIORITY: number,
    },
    port_directions: {
        ADDR: 'input',
        DATA: 'input',
    },
    connections: {
        ADDR: DigitalVector,
        DATA: DigitalVector,
    }
}

export interface IMem extends IDigitalCell {
    type: '$mem',
    parameters: {
        MEMID: string,
        SIZE: number,
        OFFSET: number,
        ABITS: number,
        WIDTH: number,
        INIT: number,
        RD_PORTS: number,
        RD_CLK_ENABLE: number,
        RD_CLK_POLARITY: number,
        RD_TRANSPARENT: number,
        WR_PORTS: number,
        WR_CLK_ENABLE: number,
        WR_CLK_POLARITY: number,
    },
    port_directions: {
        RD_CLK: 'input',
        RD_EN: 'input',
        RD_ADDR: 'input',
        RD_DATA: 'output',
        WR_CLK: 'input',
        WR_EN: 'input',
        WR_ADDR: 'input',
        WR_DATA: 'input',
    },
    connections: {
        RD_CLK: DigitalVector,
        RD_EN: DigitalVector,
        RD_ADDR: DigitalVector,
        RD_DATA: DigitalVector,
        WR_CLK: DigitalVector,
        WR_EN: DigitalVector,
        WR_ADDR: DigitalVector,
        WR_DATA: DigitalVector,
    }
}
