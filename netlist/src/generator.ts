import {writeFileSync} from 'fs';
import {resolve} from 'path';
import {INetlist, IAttrs, IParams, IModules, IModule,
        IPorts, IPort, ICells, ICell, INets, INet,
        IConnections, Vector} from '@electron-lang/celllib';

export abstract class Generator {
    readonly path: string;
    readonly netlist: INetlist;

    constructor(path: string, netlist: INetlist) {
        this.path = path;
        this.netlist = netlist;
    }

    protected genHashmap(obj: any, generate: (key: string, value: any) => string): string {
        let str = '';
        for (let key in obj) {
            str += generate(key, obj[key]);
        }
        return str;
    }

    generate() {
        writeFileSync(resolve(this.path), this.generateNetlist(this.netlist));
    }

    generateNetlist(netlist: INetlist): string {
        return this.generateModules(netlist.modules);
    }

    generateModules(modules: IModules): string {
        return this.genHashmap(modules, this.generateModule);
    }

    generateModule(name: string, module: IModule): string {
        return '';
    }

    generateAttributes(attributes?: IAttrs) {
        return this.genHashmap(attributes || {}, this.generateAttribute);
    }

    generateAttribute(name: string, value: any): string {
        return '';
    }

    generateParameters(parameters: IParams) {
        return this.genHashmap(parameters, this.generateParameter);
    }

    generateParameter(name: string, value: any): string {
        return '';
    }

    generatePorts(ports: IPorts) {
        return this.genHashmap(ports, this.generatePort);
    }

    generatePort(name: string, port: IPort) {
        return '';
    }

    generateCells(cells: ICells) {
        return this.genHashmap(cells, this.generateCell);
    }

    generateCell(name: string, cell: ICell) {
        return '';
    }

    generateNets(nets: INets) {
        return this.genHashmap(nets, this.generateNet);
    }

    generateNet(name: string, net: INet) {
        return '';
    }

    generateConnections(connections: IConnections) {
        return this.genHashmap(connections, this.generateConnection)
    }

    generateConnection(port_name: string, vec: Vector) {
        return '';
    }
}
