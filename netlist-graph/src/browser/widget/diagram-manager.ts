import { inject, injectable } from 'inversify'
import URI from '@theia/core/lib/common/uri'
import { DisposableCollection } from '@theia/core/lib/common'
import { OpenerOptions } from '@theia/core/lib/browser'
import { FileSystem } from '@theia/filesystem/lib/common'
import { FileSystemWatcher } from '@theia/filesystem/lib/browser/filesystem-watcher'
import { DiagramManagerImpl, DiagramWidget,
         DiagramWidgetFactory } from 'theia-sprotty/lib'
import { SCHEMATIC_DIAGRAM_TYPE } from './diagram-type'
import { NetlistGraphModelSource } from '../graph/model-source'
import { NetlistGraphGenerator } from '../graph/netlist'

@injectable()
export class SchematicDiagramManager extends DiagramManagerImpl {

    protected readonly toDispose = new DisposableCollection()

    @inject(DiagramWidgetFactory)
    private readonly _diagramWidgetFactory!: DiagramWidgetFactory

    @inject(FileSystem)
    protected readonly fileSystem!: FileSystem

    @inject(FileSystemWatcher)
    protected readonly watcher!: FileSystemWatcher


    readonly diagramType: string = SCHEMATIC_DIAGRAM_TYPE

    iconClass: string = 'fa fa-microchip'
    label: string = 'Schematic'

    canHandle(uri: URI, options?: OpenerOptions): number {
        if (uri.path.base.endsWith('.lec.json')) {
            return 10
        }
        return 0
    }

    protected createDiagramWidget(uri: URI): DiagramWidget {
        const widget = super.createDiagramWidget(uri)
        this.createModel(uri, widget.modelSource as NetlistGraphModelSource)
        return widget
    }

    protected async createModel(uri: URI, modelSource: NetlistGraphModelSource)
    : Promise<void> {
        this.watcher.watchFileChanges(uri)
            .then((disposable) => this.toDispose.push(disposable))
        this.toDispose.push(this.watcher.onFilesChanged(changes => {
            return this.onDidModelChanged(uri, modelSource)
        }))
        await this.onDidModelChanged(uri, modelSource)
    }

    protected async onDidModelChanged(uri: URI, modelSource: NetlistGraphModelSource)
    : Promise<void> {
        const { content } = await this.fileSystem.resolveContent(uri.toString())
        const netlist = JSON.parse(content)
        const generator = modelSource.graphGenerator as NetlistGraphGenerator
        generator.addNetlist(uri.toString(), netlist)
        await modelSource.updateModel()
    }

    get diagramWidgetFactory(): DiagramWidgetFactory {
        return this._diagramWidgetFactory
    }
}
