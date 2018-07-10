import { Container, ContainerModule, interfaces } from 'inversify'
import { TYPES, ConsoleLogger, LogLevel, SGraphFactory, configureModelElement,
         SGraph, SGraphView, HtmlRoot, HtmlRootView, PreRenderedElement,
         PreRenderedView, SCompartment, SCompartmentView, PolylineEdgeView,
         defaultModule, selectModule, moveModule, boundsModule, openModule,
         viewportModule, exportModule, hoverModule, edgeEditModule,
         fadeModule } from 'sprotty/lib'
import { FileNode, ModuleNode, SymbolNode, SchematicNode, GroupNode,
         PinPort, PortNode, NetEdge } from './graph-model'
import { FileNodeView, ModuleNodeView, SymbolNodeView, SchematicNodeView,
         GroupNodeView, PinPortView, PortNodeView } from './graph-views'
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
        configureModelElement(context, 'node:file', FileNode, FileNodeView)
        configureModelElement(context, 'node:module', ModuleNode, ModuleNodeView)
        configureModelElement(context, 'node:symbol', SymbolNode, SymbolNodeView)
        configureModelElement(context, 'node:schematic', SchematicNode, SchematicNodeView)
        configureModelElement(context, 'node:group', GroupNode, GroupNodeView)
        configureModelElement(context, 'node:port', PortNode, PortNodeView)
        configureModelElement(context, 'port:pin', PinPort, PinPortView)
        configureModelElement(context, 'edge:net', NetEdge, PolylineEdgeView)
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
