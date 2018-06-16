import { ContainerModule } from 'inversify';
import { LanguageServerContribution } from '@theia/languages/lib/node';
import { ElectronContribution } from './electron-contribution';

export default new ContainerModule(bind => {
    bind(LanguageServerContribution).to(ElectronContribution).inSingletonScope();
});
