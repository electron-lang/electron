import * as snabbdom from 'snabbdom-jsx'
import { VNode } from 'snabbdom/vnode'
import { RenderingContext, IView } from 'sprotty/lib'
import { GroupNode, PinPort } from './graph-model'

const JSX = {createElement: snabbdom.svg};

export class GroupNodeView implements IView {
    render(node: Readonly<GroupNode>, context: RenderingContext): VNode {
        return (<g>
                <text x={0} y={node.hasTopPins ? -23 : -3}>{node.name}</text>
                <rect class-sprotty-node={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                class-body={true}
                width={Math.max(node.size.width, 20)}
                height={Math.max(node.size.height, 20)}
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
                <text class-pad-label={true}
                x={pinLength / 2 * pinDir}
                y={0}>{port.pad}</text>
                <line class-sprotty-port={true}
                class-mouseover={port.hoverFeedback}
                class-selected={port.selected}
                class-pin={true}
                x1={0} y1={3}
                x2={pinLength * pinDir} y2={3}
                ></line>
                <text class-pin-label={true}
                class-pin-label-left={labelLeft}
                x={5 * -pinDir}
                y={0}>{port.name}</text>
                </g>
                </g>) as any as VNode
    }
}
