import { inject, injectable } from 'inversify'
import { MenuContribution, MenuModelRegistry,
         CommandContribution, CommandRegistry,
         CommandHandler } from '@theia/core/lib/common'
import { EDITOR_CONTEXT_MENU, EditorManager } from '@theia/editor/lib/browser'
import { ElectronOpenHandler } from './electron-open-handler'

export namespace ElectronCommands {
    export const OPEN_IN_SCHEMATIC = 'schematic.open'
}

@injectable()
export class ElectronMenuContribution implements MenuContribution {

    registerMenus(registry: MenuModelRegistry) {
        registry.registerMenuAction(EDITOR_CONTEXT_MENU, {
            commandId: ElectronCommands.OPEN_IN_SCHEMATIC
        })
    }
}

export class OpenInSchematicHandler implements CommandHandler {
    constructor(protected readonly editorManager: EditorManager,
                protected readonly openHandler: ElectronOpenHandler) {

    }

    execute(...args: any[]) {
        const editor = this.editorManager.currentEditor
        if (editor === undefined) return
        this.openHandler.open(editor.editor.uri)
    }
}

@injectable()
export class ElectronCommandContribution implements CommandContribution {
    @inject(EditorManager)
    protected readonly editorManager!: EditorManager

    @inject(ElectronOpenHandler)
    protected readonly openHandler!: ElectronOpenHandler

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand({
            id: ElectronCommands.OPEN_IN_SCHEMATIC,
            label: 'Open in schematic'
        })
        registry.registerHandler(
            ElectronCommands.OPEN_IN_SCHEMATIC,
            new OpenInSchematicHandler(this.editorManager, this.openHandler)
        )
    }
}
