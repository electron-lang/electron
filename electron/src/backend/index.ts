import { IModule } from './ir'

export interface IBackend {
    emit(mods: IModule[], outputPath: string): void;
}

export { JsonBackend } from './json'
export { YosysBackend } from './yosys'
export { KicadBackend } from './kicad'
export { BomBackend } from './bom'
