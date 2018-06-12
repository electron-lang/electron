import {readFileSync, writeFileSync} from 'fs';
import {resolve} from 'path';
import {parse} from 'json5';
import {validate} from 'jsonschema';
import {INetlist} from '@electron-lang/celllib';

export function readJson(file: string): INetlist {
    const netlist = parse(readFileSync(resolve(file)).toString());
    const schema = parse(readFileSync(resolve(__dirname, 'netlist.schema'))
                         .toString());
    const result = validate(netlist, schema);
    return result.instance as INetlist;
}

export function writeJson(file: string, netlist: INetlist) {
    writeFileSync(resolve(file), JSON.stringify(netlist));
}
