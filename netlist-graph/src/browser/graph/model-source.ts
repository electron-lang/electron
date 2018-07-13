import { injectable, inject, optional } from 'inversify'
import { TYPES, LocalModelSource, ILogger, IActionDispatcher,
         ActionHandlerRegistry, ViewerOptions, IModelLayoutEngine,
         IStateAwareModelProvider, IPopupModelProvider,
         Action, OpenAction } from 'sprotty/lib'
import { IGraphGenerator } from './graph-generator'
import { isGroup, isPort } from './graph-model'

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

    protected initialize(registry: ActionHandlerRegistry): void {
        super.initialize(registry);

        registry.register(OpenAction.KIND, this);
    }

    updateModel(): Promise<void> {
        this.currentRoot.children = this.graphGenerator.nodes
            .concat(this.graphGenerator.edges) ;
        return super.updateModel();
    }

    handle(action: Action): void {
        switch (action.kind) {
            case OpenAction.KIND:
                const elemId = (action as OpenAction).elementId
                const elem = this.graphGenerator.index.getById(elemId)
                if (isGroup(elem)) {
                    this.graphGenerator.open(elem.link)
                } else if (isPort(elem)) {
                    this.graphGenerator.close()
                } else {
                    console.log('No link')
                }
                this.updateModel()
                break;
            default:
                super.handle(action);
        }
    }

}
