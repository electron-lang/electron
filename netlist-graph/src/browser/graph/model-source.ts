import { injectable, inject, optional } from 'inversify'
import { TYPES, LocalModelSource, ILogger, IActionDispatcher,
         ActionHandlerRegistry, ViewerOptions, IModelLayoutEngine,
         IStateAwareModelProvider, IPopupModelProvider,
         Action, OpenAction, SelectAction, SelectCommand } from 'sprotty/lib'
import { OpenInTextEditorMessage } from '../widget/diagram-config'
import { IGraphGenerator } from './graph-generator'
import { isGroup, isPort, isPin, isModule, isCell, SrcLoc } from './graph-model'
import * as urn from './urn'

@injectable()
export class NetlistGraphModelSource extends LocalModelSource {

    loadIndicator: (loadStatus: boolean) => void = () => {}
    openInTextEditor: (message: OpenInTextEditorMessage) => void = () => {}

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
        registry.register(SelectCommand.KIND, this);
    }

    updateModel(): Promise<void> {
        this.currentRoot.children = this.graphGenerator.elements
        return super.updateModel();
    }

    handle(action: Action): void {
        switch (action.kind) {
            case OpenAction.KIND: {
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
            }
            case SelectCommand.KIND: {
                const elemId = (action as SelectAction).selectedElementsIDs[0]
                const elem = this.graphGenerator.index.getById(elemId)
                if (isPort(elem)) {
                    this.trace(elem.urn.urn.urn.urn.uri, elem.trace)
                } else if (isPin(elem)) {
                    this.trace(elem.urn.urn.urn.urn.urn.uri, elem.trace)
                } else if (isGroup(elem)) {
                    if (elem.urn.tag === 'schematic-cell-group') {
                        const cell = this.graphGenerator.index
                            .getById(urn.toString(elem.urn.urn))
                        if (isCell(cell)) {
                            this.trace(cell.urn.urn.urn.urn.uri, cell.trace)
                        } else {
                            console.log(elemId)
                        }
                    } else if (elem.urn.tag === 'symbol-group') {
                        const mod = this.graphGenerator.index
                            .getById(urn.toString(elem.urn.urn.urn))
                        if (isModule(mod)) {
                            this.trace(mod.urn.urn.uri, mod.trace)
                        } else {
                            console.log(elemId)
                        }
                    }
                } else {
                    console.log(elemId)
                }
                break;
            }
            default:
                super.handle(action);
        }
    }

    trace(uri: string, src: SrcLoc | undefined): void {
        if (!src) return

        this.openInTextEditor({
            location: {
                uri: uri.split('.').slice(0, -1).join('.'),
                range: {
                    start: {
                        line: src.startLine - 1,
                        character: src.startColumn - 1,
                    },
                    end: {
                        line: src.endLine - 1,
                        character: src.endColumn,
                    }
                }
            },
            forceOpen: false
        })
    }

}
