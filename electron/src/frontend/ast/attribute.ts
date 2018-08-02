import { ISrcLoc, SrcLoc } from '../../diagnostic'
import { Expr } from './expression'

export interface IAttr {
    tag: 'attr'
    name: string
    params: Expr[]
    src: ISrcLoc
}

export function Attr(name: string, params: Expr[], src?: ISrcLoc): IAttr {
    return {
        tag: 'attr',
        name,
        params,
        src: src || SrcLoc.empty(),
    }
}
