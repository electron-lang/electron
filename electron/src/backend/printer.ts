import { IDoc, nest, intersperse, enclose, render,
         parens, braces, dquotes, line } from 'prettier-printer'
import * as ir from './ir'

export interface IPrint<T> {
    print: (e: T) => IDoc
}

export function printIR(ir: ir.IR): string {
    return render(80, printerInstance.print(ir))
}

export function printDesignIR(ir: ir.IModule[]): string {
    return ir.map((mod) => printIR(mod)).join('\n') + '\n'
}

class Printer implements IPrint<ir.IR> {
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
                    children.length > 0 ? [
                        nest(2, [line, intersperse(line, children)]),
                        line,
                    ] : [],
                    '}',
                ]
            },
            Attr: (attr) => {
                return ['@', attr.name, '(', this.printValue(attr.value), ')', line]
            },
            Param: (param) => {
                return [param.name, '=', this.printValue(param.value)]
            },
            Cell: (cell) => {
                const mod = cell.module.name
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

    printValue(val: string | boolean | number | ir.Bit[] | string[]): IDoc {
        if (typeof val === 'string') {
            return ['"', val, '"']
        } else if (typeof val === 'object') {
            const array: string[] = val
            return ['(', intersperse(', ', array.map((x) => {
                return enclose(dquotes, x)
            })), ')']
        } else {
            return val.toString()
        }
    }

    printSigList(sigs: ir.ISig[]): IDoc {
        const sigsList = sigs.map((sig) => this.printSig(sig))
        return enclose(parens, intersperse(', ', sigsList))
    }

    printSig(sig: ir.ISig): IDoc {
        return ir.matchSig<IDoc>({
            Bit: (b) => ['"', b, '"'],
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
