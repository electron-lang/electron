import * as ir from './ir'
export { ir }

export interface IBackend {
    emit(mods: ir.IModule[], outputPath: string): void;
}

export { JsonBackend } from './json'
export { YosysBackend } from './yosys'
export { KicadBackend } from './kicad'
export { BomBackend } from './bom'
