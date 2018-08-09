import { IPass } from '.'
import { Logger } from '../diagnostic'
import { ir, printIR } from '../backend'

export function findRoots(mods: ir.IModule[]): ir.IModule[] {
    const notRoots: ir.IModule[] = []
    for (let mod of mods) {
        for (let cell of mod.cells) {
            notRoots.push(cell.module)
        }
    }
    const roots: ir.IModule[] = []
    for (let mod of mods) {
        if (!notRoots.find((nr) => mod === nr)) {
            roots.push(mod)
        }
    }
    return roots
}

export function findLeafs(mods: ir.IModule[]): ir.IModule[] {
    return mods.filter((mod) => mod.cells.length === 0)
}

export class HierarchyPass implements IPass {

    constructor(readonly logger: Logger) {}

    hierarchy(mod: ir.IModule): void {
        const newCells: ir.ICell[] = []
        for (const cell of mod.cells) {
            for (let assign of cell.assigns) {
                // Keep signal!!
                if (assign.lhs.ref.value.length !== assign.rhs.length) {
                    this.logger.error('Signals need to have same length.', assign.src)
                    return
                }
                for (let i = 0; i < assign.lhs.ref.value.length; i++) {
                    assign.lhs.ref.value[i].value = assign.rhs[i].value
                }
            }
            this.hierarchy(cell.module)
            if (cell.module.cells.length === 0) {
                newCells.push(cell)
            } else {
                for (let childCell of cell.module.cells) {
                    newCells.push(childCell)
                    for (let cassign of childCell.assigns) {
                        for (let assign of cell.assigns) {
                            if (cassign.rhs === assign.lhs.ref.value) {
                                console.log('--------------------------------')
                                console.log(childCell.name + '.' + printIR(cassign))
                                console.log(cell.name + '.' + printIR(assign))
                                cassign.lhs.ref.value = assign.rhs
                                console.log(childCell.name + '.' + printIR(cassign))
                            }
                        }
                    }
                }
            }
        }
        mod.cells = newCells
    }

    transform(mods: ir.IModule[]): ir.IModule[] {
        const roots = findRoots(mods)
        const leafs = findLeafs(mods)
        for (let mod of roots) {
            this.hierarchy(mod)
        }
        return [].concat.apply([], [roots, leafs])
    }
}
