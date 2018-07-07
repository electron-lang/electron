import { injectable, inject, optional } from 'inversify'
import { TYPES, LocalModelSource, ILogger, IActionDispatcher,
         ActionHandlerRegistry, ViewerOptions, IModelLayoutEngine,
         IStateAwareModelProvider, IPopupModelProvider,
         SModelElementSchema } from 'sprotty/lib'
import { IGraphGenerator } from './graph-generator'
//import { NetlistModuleNodeSchema, isNode } from './graph-model'

@injectable()
export class NetlistGraphModelSource extends LocalModelSource {

    loadIndicator: (loadStatus: boolean) => void = () => {}

    constructor(@inject(TYPES.IActionDispatcher)
                actionDispatcher: IActionDispatcher,
                @inject(TYPES.ActionHandlerRegistry)
                actionHandlerRegistry: ActionHandlerRegistry,
                @inject(TYPES.ViewerOptions) viewerOptions: ViewerOptions,
                @inject(TYPES.ILogger) logger: ILogger,
                @inject(IGraphGenerator)
                public readonly graphGenerator: IGraphGenerator,
                @inject(TYPES.StateAwareModelProvider) @optional()
                modelProvider?: IStateAwareModelProvider,
                @inject(TYPES.IPopupModelProvider) @optional()
                popupModelProvider?: IPopupModelProvider,
                @inject(TYPES.IModelLayoutEngine) @optional()
                layoutEngine?: IModelLayoutEngine) {
        super(actionDispatcher, actionHandlerRegistry, viewerOptions, logger,
              modelProvider, popupModelProvider, layoutEngine)

        this.currentRoot = {
            type: 'graph',
            id: 'netlist-graph',
            children: []
        }
    }

    updateModel(): Promise<void> {
        const gen = this.graphGenerator;
        const nodes: SModelElementSchema[] = gen.nodes
        const edges: SModelElementSchema[] = gen.edges
        this.currentRoot.children = nodes.concat(edges);
        return super.updateModel();
    }
}
