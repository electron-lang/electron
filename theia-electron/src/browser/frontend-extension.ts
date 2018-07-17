import { ContainerModule } from 'inversify';
import { OpenHandler } from '@theia/core/lib/browser'
import { LanguageClientContribution } from '@theia/languages/lib/browser';
import { LanguageGrammarDefinitionContribution } from '@theia/monaco/lib/browser/textmate';
import { ElectronClientContribution } from './electron-client-contribution';
import { ElectronGrammarContribution } from './electron-grammar-contribution';
import { ElectronOpenHandler } from './electron-open-handler'

export default new ContainerModule(bind => {
    bind(ElectronClientContribution).toSelf().inSingletonScope();
    bind(LanguageClientContribution).toDynamicValue(ctx =>
        ctx.container.get(ElectronClientContribution)).inSingletonScope();
    bind(LanguageGrammarDefinitionContribution).to(ElectronGrammarContribution)
        .inSingletonScope();
    bind(ElectronOpenHandler).toSelf().inSingletonScope();
    bind(OpenHandler).toDynamicValue(ctx =>
        ctx.container.get(ElectronOpenHandler));
});
