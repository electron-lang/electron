import ElkConstructor from 'elkjs/lib/elk.bundled'
import { ElkFactory } from './graph-layout'

const elkFactory: ElkFactory = () => new ElkConstructor({
    algorithms: ['layered']
})

export default elkFactory
