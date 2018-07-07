import { RenderingContext, IView } from 'sprotty/lib'
import * as snabbdom from 'snabbdom-jsx'
import { VNode } from 'snabbdom/vnode'
import { GroupNode, PortsNode, PinPort } from './graph-model'

const JSX = {createElement: snabbdom.svg};

export class GroupNodeView implements IView {
    render(node: Readonly<GroupNode>, context: RenderingContext): VNode {
        return (<g>
            <rect class-sprotty-node={true}
                  class-group={true}
                  width={Math.max(node.size.width, 0)}
                  height={Math.max(node.size.height, 0)}
               ></rect>
            {context.renderChildren(node)}
        </g>) as any as VNode
    }
}

export class PortsNodeView implements IView {
    render(node: Readonly<PortsNode>, context: RenderingContext): VNode {
        return (<g>
            <rect class-sprotty-node={true}
                  class-mouseover={node.hoverFeedback}
                  class-selected={node.selected}
                  class-ports={true}
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
        return (<g>
            <g transform={rotate ? `translate(0, ${pinLength}) rotate(-90)` : ''}>
                <text class-pad-label={true}
                    x={pinLength/2}
                    y={0}>{port.pad}</text>
                <line class-sprotty-port={true}
                      class-mouseover={port.hoverFeedback}
                      class-selected={port.selected}
                      class-pin={true}
                      x1={pinLength} y1={3}
                      x2={0} y2={3}
                  ></line>
               {context.renderChildren(port)}
            </g>
        </g>) as any as VNode
    }
}



/*
export class SymbolPortView implements IView {
    render(model: FixedPort, context: RenderingContext): VNode {
        return (
            <g  class-symbol-port={true}
                class-selected={model.selected}
                class-mouseover={model.hoverFeedback}>
                <circle class-sprotty-port={true} class-port-body={true} r={1} />
            </g>
        )
    }
}

export class ModulePortView implements IView {
    render(model: ChipyPort, context: RenderingContext): VNode {
        return (
            <g  class-module-port={true}
                class-selected={model.selected}
                class-mouseover={model.hoverFeedback}>
                <rect class-sprotty-port={true} class-port-body={true} width="4" height="4"/>
            </g>
        )
    }
}

export class SymbolNodeView implements RectangularNodeView {
    render(model: ChipySymbol, context: RenderingContext): VNode {
        return (
            <g  class-symbol={true}
                class-sprotty-node={true}
                class-selected={model.selected}
                class-mouseover={model.hoverFeedback}>
                {context.renderChildren(model)}
            </g>
        )
    }
}

export class ModuleNodeView implements RectangularNodeView {
    render(model: ChipyModule, context: RenderingContext): VNode {
        return (
            <g  class-module={true}
                class-sprotty-node={true}
                class-selected={model.selected}
                class-mouseover={model.hoverFeedback}>
                <rect class-module-body={true}
                      width={Math.max(0, model.bounds.width)}
                      height={Math.max(0, model.bounds.height)} />
                {context.renderChildren(model)}
            </g>
        )
    }
}
*/
