import { ContainerModule } from 'inversify';
import { FrontendApplicationContribution,
         OpenHandler } from '@theia/core/lib/browser'
import { DiagramConfiguration, DiagramManager, DiagramManagerProvider,
         DiagramWidget, DiagramWidgetFactory,
         DiagramWidgetOptions } from 'theia-sprotty/lib'
import { SCHEMATIC_DIAGRAM_TYPE } from './widget/diagram-type'
import { SchematicDiagramConfiguration } from './widget/diagram-config'
import { SchematicDiagramManager } from './widget/diagram-manager'
import { SchematicDiagramWidget } from './widget/diagram-widget'

import 'sprotty/css/sprotty.css'
import 'theia-sprotty/css/theia-sprotty.css'
import '../../src/browser/style/schematic.css'

export default new ContainerModule(bind => {
    bind(DiagramConfiguration).to(SchematicDiagramConfiguration).inSingletonScope()
    bind(SchematicDiagramManager).toSelf().inSingletonScope()
    bind(DiagramManagerProvider).toProvider<DiagramManager>(context => {
        return () => Promise.resolve(context.container.get(SchematicDiagramManager))
    }).whenTargetNamed(SCHEMATIC_DIAGRAM_TYPE)
    bind(DiagramWidgetFactory).toFactory<DiagramWidget>(context => {
        return (options: DiagramWidgetOptions) => new SchematicDiagramWidget(options)
    })
    bind(FrontendApplicationContribution).toDynamicValue(context => {
        return context.container.get(SchematicDiagramManager)
    })
    bind(OpenHandler).toDynamicValue(context => {
        return context.container.get(SchematicDiagramManager)
    })
});
