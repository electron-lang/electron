import * as snabbdom from 'snabbdom-jsx'
import { VNode } from 'snabbdom/vnode'
import { RenderingContext, IView } from 'sprotty/lib'
import { FileNode, ModuleNode, SymbolNode, GroupNode, PinPort,
         SchematicNode, PortNode } from './graph-model'

const JSX = {createElement: snabbdom.svg};

export class FileNodeView implements IView {
    render(node: Readonly<FileNode>, context: RenderingContext): VNode {
        if (node.hidden) {
            return (<g></g>) as any as VNode
        }
        return (<g>{context.renderChildren(node)}</g>) as any as VNode
    }
}

export class ModuleNodeView implements IView {
    render(node: Readonly<ModuleNode>, context: RenderingContext): VNode {
        if (node.hidden) {
            return (<g></g>) as any as VNode
        }
        return (<g>{context.renderChildren(node)}</g>) as any as VNode
    }
}

export class SymbolNodeView implements IView {
    render(node: Readonly<SymbolNode>, context: RenderingContext): VNode {
        if (node.hidden) {
            return (<g></g>) as any as VNode
        }
        return (<g>{context.renderChildren(node)}</g>) as any as VNode
    }
}

export class SchematicNodeView implements IView {
    render(node: Readonly<SchematicNode>, context: RenderingContext): VNode {
        if (node.hidden) {
            return (<g></g>) as any as VNode
        }
        return (<g>{context.renderChildren(node)}</g>) as any as VNode
    }
}

export class GroupNodeView implements IView {
    render(node: Readonly<GroupNode>, context: RenderingContext): VNode {
        const nv = Math.max(node.nleft, node.nright, 1)
        const nh = Math.max(node.ntop, node.nbottom, 1)
        const minWidth = nh * 20
        const minHeight = nv * 20
        let name = node.urn.urn.urn.modName
        if (node.urn.groupName !== 'default') {
            name + '_' + node.urn.groupName
        }
        return (<g>
                <text x={0} y={node.ntop > 0 ? -23 : -3}>{name}</text>
                <rect class-sprotty-node={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                class-body={true}
                width={Math.max(node.size.width, minWidth)}
                height={Math.max(node.size.height, minHeight)}
                ></rect>
                {context.renderChildren(node)}
                </g>) as any as VNode
    }
}

export class PinPortView implements IView {
    render(port: Readonly<PinPort>, context: RenderingContext): VNode {
        const pinLength = 20
        const rotate = port.side === 'top' || port.side === 'bottom'
        const labelLeft = port.side === 'top' || port.side === 'right'
        const pinDir = labelLeft ? 1 : -1
        return (<g>
                <g transform={rotate ? `translate(0, ${pinLength}) rotate(-90)` : ''}>
                <text class-acenter={true}
                x={pinLength / 2 * pinDir}
                y={0}>{port.pad}</text>
                <line class-sprotty-port={true}
                class-mouseover={port.hoverFeedback}
                class-selected={port.selected}
                x1={0} y1={3}
                x2={pinLength * pinDir} y2={3}
                ></line>
                <text class-aleft={!labelLeft}
                class-aright={labelLeft}
                x={5 * -pinDir}
                y={0}>{port.urn.portName}</text>
                </g>
                </g>) as any as VNode
    }
}

export class PortNodeView implements IView {
    render(port: Readonly<PortNode>, context: RenderingContext): VNode {
        return (<g class-orient0={port.orient === 0}
                class-orient90={port.orient === 90}
                class-orient180={port.orient === 180}
                class-orient270={port.orient === 270}>
                <text x={0} y={-3} class-aleft={true}>{port.urn.portName}</text>
                <path class-sprotty-node={true}
                class-mouseover={port.hoverFeedback}
                class-selected={port.selected}
                d="M0,0 V20 H15 L30,10 15,0 Z"/>
                </g>) as any as VNode
    }
}
