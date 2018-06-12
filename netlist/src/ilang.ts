import {INetlist, IModule, ICell, Vector} from '@electron-lang/celllib';
import {Generator} from './generator';

class ILangGenerator extends Generator {

    generateModule(name: string, module: IModule): string {
        let moduleString = '';
        moduleString += super.generateAttributes(module.attributes);
        moduleString += `module {name}\n`;
        moduleString += super.generateCells(module.cells);
        moduleString += 'end\n';
        return moduleString;
    }

    generateAttribute(key: string, value: any): string {
        return `attribute {key} {value}\n`;
    }

    generateCell(name: string, cell: ICell): string {
        let cellString = '';
        cellString += super.generateAttributes(cell.attributes);
        cellString += `cell {cell.type} {name}\n`;
        cellString += super.generateParameters(cell.parameters);
        cellString += super.generateConnections(cell.connections);
        cellString += 'end\n';
        return '';
    }

    generateParameter(key: string, value: any): string {
        return `parameter {key} {value}\n`;
    }

    generateConnection(port: string, vec: Vector): string {
        return `connect {port} {vec.length}'{vec.join('')}`;
    }
}

export function writeILang(path: string, netlist: INetlist) {
    (new ILangGenerator(path, netlist)).generate();
}
