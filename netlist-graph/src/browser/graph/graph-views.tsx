import { RenderingContext, IView } from 'sprotty/lib'
import * as snabbdom from 'snabbdom-jsx'
import { VNode } from 'snabbdom/vnode'
import { NetlistModuleNode } from './graph-model'

const JSX = {createElement: snabbdom.svg};

export class NetlistModuleNodeView implements IView {
    render(node: Readonly<NetlistModuleNode>, context: RenderingContext): VNode {
        return <g>
            <rect class-sprotty-node={true}
                  class-mouseover={node.hoverFeedback}
                  class-selected={node.selected}
                  width={Math.max(node.size.width, 0)}
                  height={Math.max(node.size.height, 0)}
                ></rect>
            {context.renderChildren(node)}
        </g>
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
