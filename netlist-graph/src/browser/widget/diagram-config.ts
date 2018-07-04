import { inject, injectable, Container } from 'inversify'
import { StatusBar, StatusBarAlignment } from '@theia/core/lib/browser'
import { overrideViewerOptions, TYPES, KeyTool } from 'sprotty/lib'
import { DiagramConfiguration, TheiaKeyTool } from 'theia-sprotty/lib'
import { SCHEMATIC_DIAGRAM_TYPE } from './diagram-type'
import { NetlistGraphModelSource } from '../graph/model-source'
import { IGraphGenerator } from '../graph/graph-generator'
import { ElkFactory } from '../graph/graph-layout'
import { NetlistGraphGenerator } from '../graph/netlist'
import containerFactory from '../graph/graph-sprotty-config'
import elkFactory from '../graph/elk-bundled'

@injectable()
export class SchematicDiagramConfiguration implements DiagramConfiguration {
    readonly diagramType: string = SCHEMATIC_DIAGRAM_TYPE

    @inject(StatusBar) protected readonly statusBar!: StatusBar;

    createContainer(widgetId: string): Container {
        const container = containerFactory((bind, unbind, isBound, rebind) => {
            bind(ElkFactory).toConstantValue(elkFactory)
            rebind(IGraphGenerator).to(NetlistGraphGenerator).inSingletonScope()
        })
        container.rebind(KeyTool).to(TheiaKeyTool).inSingletonScope()
        overrideViewerOptions(container, {
            baseDiv: widgetId
        })

        //const graphGenerator = container.get<NetlistGraphGenerator>(IGraphGenerator)

        const modelSource = container.get<NetlistGraphModelSource>(TYPES.ModelSource)
        modelSource.loadIndicator = loading => {
            if (loading) {
                this.statusBar.setElement(widgetId + '_loadIndicator', {
                    text: 'Loading $(spinner~spin)',
                    tooltip: 'Loading schematic...',
                    alignment: StatusBarAlignment.RIGHT
                })
            } else {
                this.statusBar.removeElement(widgetId + '_loadIndicator')
            }
        }

        return container
    }
}
