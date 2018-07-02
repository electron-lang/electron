import { IDoc, nest, intersperse, enclose, punctuate, render,
         parens, braces, line } from 'prettier-printer'
import * as ir from './ir'

export interface IPrint<T> {
    print: (e: T) => IDoc
}

export function printIR(ir: ir.IR): string {
    return render(80, printerInstance.print(ir))
}

class Printer implements IPrint<ir.IR> {
    //private signals: {[key: number]: string} = {}

    print(elem: ir.IR): IDoc {
        return ir.matchIR({
            Module: (mod) => {
                const children: IDoc[] = [].concat.apply([], [
                    this.printList(mod.ports),
                    this.printList(mod.nets),
                    this.printList(mod.cells),
                ])
                return [
                    this.printList(mod.attrs),
                    'module ',
                    mod.name,
                    ' ', '{',
                    children.length > 1 ? [
                        nest(2, [line, intersperse(line, children)]),
                        line,
                    ] : [],
                    '}',
                ]
            },
            Attr: (attr) => {
                return ['@', attr.name, '(', String(attr.value), ')', line]
            },
            Param: (param) => {
                return [param.name, '=', String(param.value)]
            },
            Cell: (cell) => {
                const mod: string = typeof cell.module === 'string' ? cell.module
                    : cell.module.name
                return [
                    this.printList(cell.attrs),
                    'cell', ' ', cell.name, ' = ', mod,
                    this.printArgList(cell.params),
                    ' ',
                    this.printConnectList(cell.assigns)
                ]
            },
            Port: (port) => {
                return [
                    this.printList(port.attrs),
                    port.ty,
                    this.printWidth(port.value.length),
                    ' ',
                    port.name,
                    ' = ',
                    this.printSigList(port.value),
                ]
            },
            Net: (net) => {
                return [
                    this.printList(net.attrs),
                    'net',
                    this.printWidth(net.value.length),
                    ' ',
                    net.name,
                    ' = ',
                    this.printSigList(net.value),
                ]
            },
            Assign: (assign) => {
                return [ assign.lhs.ref.name, '=', this.printSigList(assign.rhs) ]
            }
        })(elem)
    }

    printSigList(sigs: ir.ISig[]): IDoc {
        const sigsList = sigs.map((sig) => this.printSig(sig))
        return enclose(parens, intersperse(', ', sigsList))
    }

    printSig(sig: ir.ISig): IDoc {
        return ir.matchSig<IDoc>({
            Bit: (b) => b,
            NC: () => 'nc',
            Ref: (ref) => ref.toString(), //[ref.ref.name, '[', ref.index.toString(), ']']
        })(sig)
    }

    printWidth(width: number): IDoc {
        if (width === 1) {
            return []
        }
        return ['[', width.toString(), ']']
    }

    printList(lst: ir.IR[]): IDoc[] {
        return lst.map((ir) => this.print(ir))
    }

    printArgList(lst: ir.IR[]): IDoc {
        return enclose(parens, intersperse(', ', this.printList(lst)))
    }

    printConnectList(lst: ir.IAssign[]): IDoc {
        return enclose(braces, intersperse(', ', this.printList(lst)))
    }
}

export const printerInstance: IPrint<ir.IR> = new Printer()
