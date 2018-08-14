import * as ir from './ir'
export { ir }

export interface IModuleBackend {
    emit(mods: ir.Module, outputPath: string): void;
}

export interface IDesignBackend {
    emit(mods: ir.Module[], outputPath: string): void;
}

export { JsonBackend } from './json'
export { YosysBackend } from './yosys'
export { KicadBackend } from './kicad'
export { BomBackend } from './bom'
export { MarkdownBackend } from './markdown'

export * from './printer'
