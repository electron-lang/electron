import { ISrcLoc, SrcLoc } from '../diagnostic'

export type IR = IModule | IAttr | IParam | ICell | IPort | INet | IAssign

export interface IRPattern<T> {
    Module: (mod: IModule) => T
    Attr: (attr: IAttr) => T
    Param: (param: IParam) => T
    Cell: (cell: ICell) => T
    Port: (port: IPort) => T
    Net: (net: INet) => T
    Assign: (assign: IAssign) => T
}

export function matchIR<T>(p: IRPattern<T>): (ir: IR) => T {
    return (ir) => {
        switch(ir.tag) {
            case 'module':
                return p.Module(ir)
            case 'attr':
                return p.Attr(ir)
            case 'param':
                return p.Param(ir)
            case 'cell':
                return p.Cell(ir)
            case 'port':
                return p.Port(ir)
            case 'net':
                return p.Net(ir)
            case 'assign':
                return p.Assign(ir)
        }
    }
}

export interface SigPattern<T> {
    Bit: (bit: Bit) => T
    NC: () => T
    Ref: (ref: number) => T
}

export function matchSig<T>(p: SigPattern<T>): (sig: ISig) => T {
    return (sig) => {
        if (sig.value === null) {
            return p.NC()
        } else if (typeof sig.value === 'string') {
            return p.Bit(sig.value)
        } else {
            return p.Ref(sig.value)
        }
    }
}

export type Bit = '0' | '1' | 'x' | 'z'

export interface IRef<T> {
    tag: 'ref'
    ref: T
}

export class Ref<T> implements IRef<T> {
    readonly tag = 'ref'

    constructor(readonly ref: T) {}
}

export interface ISig {
    tag: 'sig'
    value: Bit | number
}

export class Sig implements ISig {
    protected static sigCounter = 0
    readonly tag = 'sig'
    readonly value: Bit | number

    constructor(value?: Bit) {
        if (value === undefined) {
            this.value = Sig.sigCounter++
        } else {
            this.value = value
        }
    }

    static resetCounter(): void {
        Sig.sigCounter = 0
    }
}

export interface IModule {
    tag: 'module',
    attrs: IAttr[]
    name: string
    ports: IPort[]
    nets: INet[]
    cells: ICell[]
    src: ISrcLoc
}

export class Module implements IModule {
    readonly tag = 'module'
    protected _attrs: IAttr[] = []
    protected _ports: IPort[] = []
    protected _nets: INet[] = []
    protected _cells: ICell[] = []
    protected attrsIndex: {[name: string]: IAttr} = {}

    constructor(readonly name: string, readonly src: ISrcLoc=SrcLoc.empty()) {}

    addAttr(attr: IAttr): void {
        this.attrs.push(attr)
        this.attrsIndex[attr.name] = attr
    }

    getAttr(name: string): IAttr | undefined {
        return this.attrsIndex[name]
    }

    get attrs(): IAttr[] {
        return this._attrs
    }

    set attrs(attrs: IAttr[]) {
        this._attrs = attrs
        this.attrsIndex = {}
        for (let attr of attrs) {
            this.attrsIndex[attr.name] = attr
        }
    }

    isImported(): boolean {
        const importAttr = this.getAttr('import')
        if (importAttr && importAttr.value) {
            return true
        }
        return false
    }

    addPort(port: IPort): void {
        this.ports.push(port)
    }

    get ports(): IPort[] {
        return this._ports
    }

    set ports(ports: IPort[]) {
        this._ports = ports
    }

    addNet(net: INet): void {
        this.nets.push(net)
    }

    get nets(): INet[] {
        return this._nets
    }

    set nets(nets: INet[]) {
        this._nets = nets
    }

    addCell(cell: ICell): void {
        this.cells.push(cell)
    }

    get cells(): ICell[] {
        return this._cells
    }

    set cells(cells: ICell[]) {
        this._cells = cells
    }
}

export interface IAttr {
    tag: 'attr'
    name: string
    value: number | string | boolean | string[]
    src: ISrcLoc
}

export class Attr implements IAttr {
    readonly tag = 'attr'

    constructor(readonly name: string,
                readonly value: boolean | number | string | string[],
                readonly src: ISrcLoc=SrcLoc.empty()) {}
}

export interface IParam {
    tag: 'param'
    name: string
    value: number | string | boolean | Bit[]
    src: ISrcLoc
}

export class Param implements IParam {
    readonly tag = 'param'

    constructor(readonly name: string,
                readonly value: number | string | boolean | Bit[],
                readonly src: ISrcLoc=SrcLoc.empty()) {}
}

export interface ICell {
    tag: 'cell'
    name: string
    module: IModule
    attrs: IAttr[]
    params: IParam[]
    assigns: IAssign[]
    src: ISrcLoc
}

export class Cell implements ICell {
    readonly tag = 'cell'
    readonly attrs: IAttr[] = []
    readonly params: IParam[] = []
    readonly assigns: IAssign[] = []

    constructor(readonly name: string,
                readonly module: IModule,
                readonly src: ISrcLoc=SrcLoc.empty()) {}

    addAttr(attr: IAttr): void {
        this.attrs.push(attr)
    }

    addParam(param: IParam): void {
        this.params.push(param)
    }

    addAssign(assign: IAssign): void {
        this.assigns.push(assign)
    }
}

export interface IPort {
    tag: 'port'
    attrs: IAttr[],
    ty: PortType
    name: string
    value: ISig[]
    src: ISrcLoc
}

export type PortType = 'input' | 'output' | 'inout' | 'analog'

export class Port implements IPort {
    readonly tag = 'port'
    readonly attrs: IAttr[] = []
    readonly value: ISig[] = []

    constructor(readonly name: string,
                readonly ty: PortType,
                width=1,
                readonly src: ISrcLoc=SrcLoc.empty()) {
        for (let i = 0; i < width; i++) {
            this.value.push(new Sig())
        }
    }

    addAttr(attr: IAttr): void {
        this.attrs.push(attr)
    }

    setValue(i: number, sig: ISig) {
        this.value[i] = sig
    }
}

export interface INet {
    tag: 'net'
    attrs: IAttr[],
    name: string
    value: ISig[]
    src: ISrcLoc,
}

export class Net implements INet {
    readonly tag = 'net'
    readonly attrs: IAttr[] = []
    readonly value: ISig[] = []

    constructor(readonly name: string,
                width=1,
                readonly src: ISrcLoc=SrcLoc.empty()) {
        for (let i = 0; i < width; i++) {
            this.value.push(new Sig())
        }
    }

    addAttr(attr: IAttr): void {
        this.attrs.push(attr)
    }

    setValue(i: number, sig: ISig) {
        this.value[i] = sig
    }
}

export interface IAssign {
    tag: 'assign'
    lhs: IRef<IPort>
    rhs: ISig[]
    src: ISrcLoc
}

export class Assign implements IAssign {
    readonly tag = 'assign'

    constructor(readonly lhs: IRef<IPort>,
                readonly rhs: ISig[],
                readonly src: ISrcLoc=SrcLoc.empty()) {}

    setValue(i: number, sig: ISig) {
        this.rhs[i] = sig
    }
}
