import { ISrcLoc, SrcLoc } from '../diagnostic'

export type IR = Module | Attr | Param | Cell | Port | Net | Assign

export interface IRPattern<T> {
    Module: (mod: Module) => T
    Attr: (attr: Attr) => T
    Param: (param: Param) => T
    Cell: (cell: Cell) => T
    Port: (port: Port) => T
    Net: (net: Net) => T
    Assign: (assign: Assign) => T
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

    constructor(public ref: T) {}
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
    attrs: Attr[]
    name: string
    ports: Port[]
    nets: Net[]
    cells: Cell[]
    src: ISrcLoc
}

export class Module implements IModule {
    readonly tag = 'module'
    protected _attrs: Attr[] = []
    protected _ports: Port[] = []
    protected _nets: Net[] = []
    protected _cells: Cell[] = []
    protected attrsIndex: {[name: string]: Attr} = {}

    constructor(readonly name: string, readonly src: ISrcLoc=SrcLoc.empty()) {}

    addAttr(attr: Attr): void {
        this.attrs.push(attr)
        this.attrsIndex[attr.name] = attr
    }

    getAttr(name: string): Attr | undefined {
        return this.attrsIndex[name]
    }

    get attrs(): Attr[] {
        return this._attrs
    }

    set attrs(attrs: Attr[]) {
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

    addPort(port: Port): void {
        this.ports.push(port)
    }

    get ports(): Port[] {
        return this._ports
    }

    set ports(ports: Port[]) {
        this._ports = ports
    }

    addNet(net: Net): void {
        this.nets.push(net)
    }

    get nets(): Net[] {
        return this._nets
    }

    set nets(nets: Net[]) {
        this._nets = nets
    }

    addCell(cell: Cell): void {
        this.cells.push(cell)
    }

    get cells(): Cell[] {
        return this._cells
    }

    set cells(cells: Cell[]) {
        this._cells = cells
    }

    getSubmodules(): Module[] {
        const submods: {[name: string]: Module} = {}
        for (let cell of this._cells) {
            submods[cell.module.name] = cell.module
            for (let mod of cell.module.getSubmodules()) {
                submods[mod.name] = mod
            }
        }
        const res: Module[] = []
        for (let name in submods) {
            res.push(submods[name])
        }
        return res
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
    module: Module
    attrs: Attr[]
    params: Param[]
    assigns: Assign[]
    src: ISrcLoc
}

export class Cell implements ICell {
    readonly tag = 'cell'
    readonly attrs: Attr[] = []
    readonly params: Param[] = []
    readonly assigns: Assign[] = []

    constructor(public name: string,
                readonly module: Module,
                readonly src: ISrcLoc=SrcLoc.empty()) {}

    addAttr(attr: Attr): void {
        this.attrs.push(attr)
    }

    addParam(param: Param): void {
        this.params.push(param)
    }

    addAssign(assign: Assign): void {
        this.assigns.push(assign)
    }
}

export interface IPort {
    tag: 'port'
    attrs: Attr[],
    ty: PortType
    name: string
    value: ISig[]
    src: ISrcLoc
}

export type PortType = 'input' | 'output' | 'inout' | 'analog'

export class Port implements IPort {
    readonly tag = 'port'
    readonly attrs: Attr[] = []
    public value: ISig[] = []
    protected attrsIndex: {[name: string]: Attr} = {}

    constructor(readonly name: string,
                readonly ty: PortType,
                width=1,
                readonly src: ISrcLoc=SrcLoc.empty()) {
        for (let i = 0; i < width; i++) {
            this.value.push(new Sig())
        }
    }

    addAttr(attr: Attr): void {
        this.attrs.push(attr)
        this.attrsIndex[attr.name] = attr
    }

    getAttr(name: string): Attr | undefined {
        return this.attrsIndex[name]
    }

    setValue(i: number, sig: ISig) {
        this.value[i] = sig
    }
}

export interface INet {
    tag: 'net'
    attrs: Attr[],
    name: string
    value: ISig[]
    src: ISrcLoc,
}

export class Net implements INet {
    readonly tag = 'net'
    readonly attrs: Attr[] = []
    readonly value: ISig[] = []

    constructor(readonly name: string,
                width=1,
                readonly src: ISrcLoc=SrcLoc.empty()) {
        for (let i = 0; i < width; i++) {
            this.value.push(new Sig())
        }
    }

    addAttr(attr: Attr): void {
        this.attrs.push(attr)
    }

    setValue(i: number, sig: ISig) {
        this.value[i] = sig
    }
}

export interface IAssign {
    tag: 'assign'
    lhs: Ref<Port>
    rhs: ISig[]
    src: ISrcLoc
}

export class Assign implements IAssign {
    readonly tag = 'assign'

    constructor(readonly lhs: Ref<Port>,
                readonly rhs: ISig[],
                readonly src: ISrcLoc=SrcLoc.empty()) {}

    setValue(i: number, sig: ISig) {
        this.rhs[i] = sig
    }
}
