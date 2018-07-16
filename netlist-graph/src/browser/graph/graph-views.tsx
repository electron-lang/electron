import * as snabbdom from 'snabbdom-jsx'
import { VNode } from 'snabbdom/vnode'
import { RenderingContext, IView, SPort } from 'sprotty/lib'
import { FileNode, ModuleNode, SymbolNode, GroupNode, PinPort,
    SchematicNode, PortNode, CellNode, sideToOrientation } from './graph-model'

const JSX = {createElement: snabbdom.svg};

class OrientationAware {
    renderContainer(orient: 0 | 90 | 180 | 270, vnode: VNode | VNode[]): VNode {
        return (<g>
                <g class-orient0={orient === 0}
                class-orient90={orient === 90}
                class-orient180={orient === 180}
                class-orient270={orient === 270}>
                {vnode}
                </g>
                </g>) as any as VNode
    }

    renderText(text: string, align: 'left' | 'right' | 'center'): VNode {
        return (<g class-aleft={align === 'left'}
                class-aright={align === 'right'}
                class-acenter={align === 'center'}>
                <text>{text}</text>
                </g>) as any as VNode
    }
}

export class FileNodeView implements IView {
    render(node: Readonly<FileNode>, context: RenderingContext): VNode {
        return (<g class-hidden={node.hidden}>{context.renderChildren(node)}</g>
               ) as any as VNode
    }
}

export class ModuleNodeView implements IView {
    render(node: Readonly<ModuleNode>, context: RenderingContext): VNode {
        return (<g class-hidden={node.hidden}>{context.renderChildren(node)}</g>
               ) as any as VNode
    }
}

export class SymbolNodeView implements IView {
    render(node: Readonly<SymbolNode>, context: RenderingContext): VNode {
        return (<g class-hidden={node.hidden}>{context.renderChildren(node)}</g>
               ) as any as VNode
    }
}

export class SchematicNodeView implements IView {
    render(node: Readonly<SchematicNode>, context: RenderingContext): VNode {
        return (<g class-hidden={node.hidden}>{context.renderChildren(node)}</g>
               ) as any as VNode
    }
}

export class GroupNodeView extends OrientationAware implements IView {
    renderGeneric(node: Readonly<GroupNode>, context: RenderingContext): VNode {
        const nv = Math.max(node.nleft, node.nright, 1)
        const nh = Math.max(node.ntop, node.nbottom, 1)
        const minWidth = nh * 20
        const minHeight = nv * 20
        return (<rect
                width={Math.max(node.size.width, minWidth)}
                height={Math.max(node.size.height, minHeight)}
                ></rect>) as any as VNode
    }

    render(node: Readonly<GroupNode>, context: RenderingContext): VNode {
        let name = node.urn.urn.urn.modName
        if (node.urn.groupName !== 'default') {
            name + '_' + node.urn.groupName
        }
        return this.renderContainer(node.orient, (
                <g>

                <g transform={`translate(0, ${node.ntop > 0 ? -23 : -3})`}>
                {this.renderText(name, 'left')}
                </g>

                {!node.skin ? this.renderGeneric(node, context) : ''}

                {context.renderChildren(node)}

                </g>) as any as VNode)
    }
}

export class PinPortView extends OrientationAware implements IView {
    renderGeneric(port: Readonly<PinPort>, context: RenderingContext): VNode {
        return (<g transform={'translate(5, 0)'}>
                {this.renderText(port.urn.portName, 'left')}
                </g>) as any as VNode
    }

    render(port: Readonly<PinPort>, context: RenderingContext): VNode {
        const pinLength = 20
        const orient = sideToOrientation(port.side)
        const vnode = (<g>

                       <line x1={0} y1={0} x2={-pinLength} y2={0}></line>

                       <g transform={`translate(${-pinLength / 2}, -3)`}>
                       {this.renderText(port.pad, 'center')}
                       </g>

                       {port.fixed ? '' : this.renderGeneric(port, context)}

                       </g>) as any as VNode

            return this.renderContainer(orient, vnode)
    }

}

export class CellNodeView implements IView {
    render(cell: Readonly<CellNode>, context: RenderingContext): VNode {
        return (<g>{context.renderChildren(cell)}</g>) as any as VNode
    }
}

export class PortNodeView extends OrientationAware implements IView {
    render(port: Readonly<PortNode>, context: RenderingContext): VNode {
        const vnode = (<g>
                       <g transform={'translate(0, -3)'}>
                       {this.renderText(port.urn.portName, 'left')}
                       </g>

                       <path d="M0,0 V20 H15 L30,10 15,0 Z"/>

                       {context.renderChildren(port)}
                       </g>) as any as VNode
        return this.renderContainer(port.orient, vnode)
    }
}

export class PortPortView implements IView {
    render(port: Readonly<SPort>, context: RenderingContext): VNode {
        return (<g></g>) as any as VNode
    }
}
