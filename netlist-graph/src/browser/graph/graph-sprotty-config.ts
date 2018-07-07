import { Container, ContainerModule, interfaces } from 'inversify'
import { TYPES, ConsoleLogger, LogLevel, SGraphFactory, configureModelElement,
         SGraph, SGraphView, HtmlRoot, HtmlRootView, PreRenderedElement,
         PreRenderedView, SLabel, SLabelView, SCompartment, SCompartmentView,
         PolylineEdgeView,
         defaultModule, selectModule, moveModule, boundsModule, openModule,
         viewportModule, exportModule, hoverModule, edgeEditModule,
         fadeModule } from 'sprotty/lib'
import { GroupNode, PinPort, NetEdge } from './graph-model'
import { GroupNodeView, PinPortView } from './graph-views'
import { IGraphGenerator } from './graph-generator'
import { NetlistGraphGenerator } from './netlist'
import { NetlistGraphModelSource } from './model-source'
import { ElkGraphLayout } from './graph-layout'


export default (additionalBindings?: interfaces.ContainerModuleCallBack) => {
    const netlistGraphModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(IGraphGenerator).to(NetlistGraphGenerator).inSingletonScope()
        bind(TYPES.ModelSource).to(NetlistGraphModelSource).inSingletonScope()
        bind(TYPES.IModelLayoutEngine).to(ElkGraphLayout)
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope()
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn)
        rebind(TYPES.IModelFactory).to(SGraphFactory).inSingletonScope()
        const context = { bind, unbind, isBound, rebind }
        configureModelElement(context, 'graph', SGraph, SGraphView)
        configureModelElement(context, 'node:group', GroupNode, GroupNodeView)
        configureModelElement(context, 'port:top', PinPort, PinPortView)
        configureModelElement(context, 'port:left', PinPort, PinPortView)
        configureModelElement(context, 'port:bottom', PinPort, PinPortView)
        configureModelElement(context, 'port:right', PinPort, PinPortView)
        //configureModelElement(context, 'port:fixed', FixedPort, FixedPortView)
        configureModelElement(context, 'edge:net', NetEdge, PolylineEdgeView)
        configureModelElement(context, 'label:group:ref', SLabel, SLabelView)
        configureModelElement(context, 'label:group:value', SLabel, SLabelView)
        configureModelElement(context, 'label:port', SLabel, SLabelView)
        configureModelElement(context, 'label:port:pad', SLabel, SLabelView)
        configureModelElement(context, 'compartment', SCompartment, SCompartmentView)
        configureModelElement(context, 'html', HtmlRoot, HtmlRootView)
        configureModelElement(context, 'pre-rendered', PreRenderedElement, PreRenderedView)
        if (additionalBindings) {
            additionalBindings(bind, unbind, isBound, rebind)
        }
    })

    const container = new Container()
    container.load(defaultModule, boundsModule, selectModule, hoverModule,
                   openModule, viewportModule, exportModule, fadeModule,
                   moveModule, edgeEditModule, netlistGraphModule)
    return container
}
