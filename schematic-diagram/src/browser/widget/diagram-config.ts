import { inject, injectable, Container } from 'inversify'
import URI from '@theia/core/lib/common/uri'
import { StatusBar, StatusBarAlignment } from '@theia/core/lib/browser'
import { overrideViewerOptions, TYPES, KeyTool } from 'sprotty/lib'
import { DiagramConfiguration, TheiaKeyTool } from 'theia-sprotty/lib'
import { SCHEMATIC_DIAGRAM_TYPE } from './diagram-type'
import { Location } from 'vscode-languageserver-types'
import { EditorManager } from '@theia/editor/lib/browser'
import { NetlistGraphModelSource } from '../graph/model-source'
import { IGraphGenerator } from '../graph/graph-generator'
import { ElkFactory } from '../graph/graph-layout'
import { NetlistGraphGenerator } from '../graph/netlist'
import containerFactory from '../graph/graph-sprotty-config'
import elkFactory from '../graph/elk-bundled'

export interface OpenInTextEditorMessage {
    location: Location
    forceOpen: boolean
}

@injectable()
export class SchematicDiagramConfiguration implements DiagramConfiguration {
    readonly diagramType: string = SCHEMATIC_DIAGRAM_TYPE

    @inject(StatusBar) protected readonly statusBar!: StatusBar;

    @inject(EditorManager)
    protected readonly editorManager!: EditorManager

    createContainer(widgetId: string): Container {
        const container = containerFactory((bind, unbind, isBound, rebind) => {
            bind(ElkFactory).toConstantValue(elkFactory)
            rebind(IGraphGenerator).to(NetlistGraphGenerator).inSingletonScope()
        })
        container.rebind(KeyTool).to(TheiaKeyTool).inSingletonScope()
        overrideViewerOptions(container, {
            baseDiv: widgetId
        })

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
        modelSource.openInTextEditor = (message) => this.openInTextEditor(message)

        return container
    }

    openInTextEditor(message: OpenInTextEditorMessage) {
        const uri = new URI(message.location.uri)
        if (!message.forceOpen) {
            this.editorManager.all.forEach(editorWidget => {
                const currentTextEditor = editorWidget.editor
                if (editorWidget.isVisible &&
                    uri.toString() === currentTextEditor.uri.toString()) {
                    currentTextEditor.cursor = message.location.range.start
                    currentTextEditor.revealRange(message.location.range)
                    currentTextEditor.selection = message.location.range
                }
            })
        } else {
            this.editorManager.open(uri).then(
                editorWidget => {
                    const editor = editorWidget.editor
                    editor.cursor = message.location.range.start
                    editor.revealRange(message.location.range)
                    editor.selection = message.location.range
                })
        }
    }
}
