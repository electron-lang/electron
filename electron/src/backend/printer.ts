import { IDoc, nest, intersperse, enclose, punctuate, render,
         parens, braces, line } from 'prettier-printer'
import { IR, IRPattern, matchIR, PortType, Expr, Bit,
         IModule, IIdent, IAttr, IParam, IAssign, IPort, INet,
         IConcat, IRef, ICell } from './ir'

export interface IPrint<T> {
    print: (e: T) => IDoc
}

export function printIR(ir: IR): string {
    return render(80, printerInstance.print(ir))
}

class Printer implements IPrint<IR> {
    print(ir: IR): IDoc {
        return matchIR({
            Module: (mod) => {
                const children: IDoc[] = [].concat.apply([], [
                    this.printList(mod.ports),
                    this.printList(mod.nets),
                    this.printList(mod.cells),
                    this.printList(mod.assigns)
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
            Ident: (id) => {
                return [id.text]
            },
            Attr: (attr) => {
                return ['@', attr.name, '(', attr.value, ')', line]
            },
            Param: (param) => {
                return [param.name, '=', String(param.value)]
            },
            Cell: (cell) => {
                return [
                    this.printList(cell.attrs),
                    'cell', ' ', cell.name, ' = ', cell.module.text,
                    this.printArgList(cell.params),
                    ' ',
                    this.printConnectList(cell.assigns)
                ]
            },
            Port: (port) => {
                return [
                    this.printList(port.attrs),
                    port.ty,
                    this.printWidth(port.width),
                    ' ',
                    port.name
                ]
            },
            Net: (net) => {
                return [
                    this.printList(net.attrs),
                    'net',
                    this.printWidth(net.width),
                    ' ',
                    net.name
                ]
            },
            Assign: (assign) => {
                return [this.print(assign.lhs), ' = ', this.print(assign.rhs)]
            },
            BitVec: (bv) => {
                return [bv.bits.length.toString(), "'", bv.bits]
            },
            Concat: (concat) => {
                return this.printArgList(concat.exprs)
            },
            Ref: (ref) => {
                return [ref.ident.text, '[', ref.from.toString(),
                        ':', ref.to.toString(), ']']
            }
        })(ir)
    }

    printWidth(width: number): IDoc {
        if (width === 1) {
            return []
        }
        return ['[', width.toString(), ']']
    }

    printList(lst: IR[]): IDoc[] {
        return lst.map((ir) => this.print(ir))
    }

    printArgList(lst: IR[]): IDoc {
        return enclose(parens, intersperse(', ', this.printList(lst)))
    }

    printConnectList(lst: IAssign[]): IDoc {
        return enclose(braces, intersperse(', ', this.printList(lst)))
    }
}

export const printerInstance: IPrint<IR> = new Printer()
