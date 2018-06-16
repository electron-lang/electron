import { ContainerModule } from 'inversify';
import { LanguageClientContribution } from '@theia/languages/lib/browser';
import { ElectronClientContribution } from './electron-client-contribution';

import './monaco-contribution';

export default new ContainerModule(bind => {
    bind(ElectronClientContribution).toSelf().inSingletonScope();
    bind(LanguageClientContribution).toDynamicValue(ctx =>
        ctx.container.get(ElectronClientContribution)).inSingletonScope();
});
