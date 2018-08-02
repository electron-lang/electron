import { inject, injectable } from 'inversify'
import URI from '@theia/core/lib/common/uri'
import { OpenHandler, OpenerOptions } from '@theia/core/lib/browser'
import { EditorManager } from '@theia/editor/lib/browser'
import { SchematicDiagramManager } from '@electron-lang/schematic-diagram/lib/browser'
import { ElectronClientContribution } from './electron-client-contribution'

@injectable()
export class ElectronOpenHandler implements OpenHandler {
    id: string = 'electron-opener'
    iconClass: string = 'fa fa-microchip'
    label: string = 'Electron'

    @inject(EditorManager)
    private readonly editorManager!: EditorManager

    @inject(SchematicDiagramManager)
    private readonly diagramManager!: SchematicDiagramManager

    @inject(ElectronClientContribution)
    private readonly electronClientContribution!: ElectronClientContribution

    canHandle(uri: URI, options?: OpenerOptions): number {
        if (uri.path.base.endsWith('.lec')) {
            return 1
        }
        return 0
    }

    open(uri: URI, options?: OpenerOptions): Promise<object | undefined> {
        return this.electronClientContribution.languageClient.then((client) => {
            return client.sendRequest('schematic/path', {
                uri: uri.toString()
            }).then((res: any) => {
                return this.editorManager.open(uri, options).then(() => {
                    return this.diagramManager.open(new URI(res.uri), options)
                })
            })
        })
    }
}
