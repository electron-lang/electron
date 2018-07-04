import { Container, ContainerModule, interfaces } from 'inversify'
import { TYPES, ConsoleLogger, LogLevel, SGraphFactory, configureModelElement,
         SGraph, SGraphView, HtmlRoot, HtmlRootView, PreRenderedElement,
         PreRenderedView, SLabel, SLabelView, SCompartment, SCompartmentView,
         PolylineEdgeView,
         defaultModule, selectModule, moveModule, boundsModule, fadeModule,
         viewportModule, exportModule, hoverModule, edgeEditModule } from 'sprotty/lib'
import { NetlistModuleNode, NetlistNetEdge } from './graph-model'
import { NetlistModuleNodeView } from './graph-views'
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
        configureModelElement(context, 'node', NetlistModuleNode, NetlistModuleNodeView)
        //configureModelElement(context, 'port', SPort, SPortView)
        configureModelElement(context, 'edge', NetlistNetEdge, PolylineEdgeView)
        configureModelElement(context, 'label', SLabel, SLabelView)
        configureModelElement(context, 'compartment', SCompartment, SCompartmentView)
        configureModelElement(context, 'html', HtmlRoot, HtmlRootView)
        configureModelElement(context, 'pre-rendered', PreRenderedElement, PreRenderedView)
        if (additionalBindings) {
            additionalBindings(bind, unbind, isBound, rebind)
        }
    })

    const container = new Container()
    container.load(defaultModule, selectModule, moveModule, boundsModule,
                   fadeModule, viewportModule, exportModule, hoverModule,
                   edgeEditModule, netlistGraphModule)
    return container
}
