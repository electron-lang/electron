import { ContainerModule } from 'inversify';
import { LanguageClientContribution } from '@theia/languages/lib/browser';
import { LanguageGrammarDefinitionContribution } from '@theia/monaco/lib/browser/textmate';
import { ElectronClientContribution } from './electron-client-contribution';
import { ElectronGrammarContribution } from './electron-grammar-contribution';

export default new ContainerModule(bind => {
    bind(ElectronClientContribution).toSelf().inSingletonScope();
    bind(LanguageClientContribution).toDynamicValue(ctx =>
        ctx.container.get(ElectronClientContribution)).inSingletonScope();
    bind(LanguageGrammarDefinitionContribution).to(ElectronGrammarContribution)
        .inSingletonScope();
});
