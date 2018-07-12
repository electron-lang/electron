import { injectable, inject } from 'inversify';
import { ELK, ElkNode, ElkGraphElement, ElkEdge, ElkShape, ElkPort,
         ElkPrimitiveEdge, ElkExtendedEdge, LayoutOptions } from 'elkjs/lib/elk-api';
import { SGraphSchema, SModelIndex, SModelElementSchema, SNodeSchema,
         SShapeElementSchema, SEdgeSchema, SPortSchema, Point,
         IModelLayoutEngine } from 'sprotty/lib';
import { isFile, isModule, isSymbol, isSchematic,
         isGroup, isPin, GroupNodeSchema, PinPortSchema,
         isPort, isCell, isNet } from './graph-model'

export type ElkFactory = () => ELK;

export const ElkFactory = Symbol('ElkFactory');

const DEBUG = false
function debugPrint(thing: any) {
    if (DEBUG) {
        console.log(JSON.stringify(thing, null, 2))
    }
}

@injectable()
export class ElkGraphLayout implements IModelLayoutEngine {

    protected readonly elk: ELK;

    constructor(@inject(ElkFactory) elkFactory: ElkFactory) {
        this.elk = elkFactory();
    }

    protected graphOptions(sgraph: SGraphSchema): LayoutOptions {
        return {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.edgeRouting': 'POLYLINE',
        }
    }

    layout(graph: SGraphSchema, index?: SModelIndex<SModelElementSchema>)
    : SGraphSchema | Promise<SGraphSchema> {
        if (graph.type !== 'graph') {
            return graph;
        }
        if (!index) {
            index = new SModelIndex();
            index.add(graph);
        }
        debugPrint(graph)
        const elkGraph = this.transformToElk(graph, index) as ElkNode
        debugPrint(elkGraph)
        const newGraph = this.elk.layout(elkGraph).then(result => {
            debugPrint(result)
            this.applyLayout(result, index!)
            return graph
        })
        debugPrint(newGraph)
        return newGraph
    }

    protected transformToElk(smodel: SModelElementSchema,
                             index: SModelIndex<SModelElementSchema>)
    : ElkGraphElement {
        switch (smodel.type) {
            case 'graph': {
                const sgraph = smodel as SGraphSchema;
                const elkNode = <ElkNode> {
                    id: sgraph.id,
                    layoutOptions: this.graphOptions(sgraph),
                }
                if (sgraph.children) {
                    elkNode.children = sgraph.children
                        .filter(c => isFile(c) && !c.hidden)
                        .map(c => this.transformToElk(c, index)) as ElkNode[]
                }
                return elkNode
            }
            case 'node:file': {
                const snode = smodel as SNodeSchema;
                const elkNode: ElkNode = {
                    id: snode.id,
                }
                if (snode.children) {
                    elkNode.children = snode.children
                        .filter(c => isModule(c) && !c.hidden)
                        .map(c => this.transformToElk(c, index)) as ElkNode[]
                }
                this.transformShape(elkNode, snode);
                return elkNode
            }
            case 'node:module': {
                const snode = smodel as SNodeSchema;
                const elkNode: ElkNode = {
                    id: snode.id,
                }
                if (snode.children) {
                    elkNode.children = snode.children
                        .filter(c => (isSymbol(c) || isSchematic(c)) && !c.hidden)
                        .map(c => this.transformToElk(c, index)) as ElkNode[]
                }
                this.transformShape(elkNode, snode);
                return elkNode
            }
            case 'node:symbol': {
                const snode = smodel as SNodeSchema;
                const elkNode: ElkNode = {
                    id: snode.id,
                }
                if (snode.children) {
                    elkNode.children = snode.children
                        .filter(c => isGroup(c))
                        .map(c => this.transformToElk(c, index)) as ElkNode[]
                }
                this.transformShape(elkNode, snode);
                return elkNode
            }
            case 'node:schematic': {
                const snode = smodel as SNodeSchema;
                const elkNode: ElkNode = {
                    id: snode.id,
                }
                if (snode.children) {
                    elkNode.ports = snode.children
                        .filter(c => isPort(c))
                        .map(c => this.transformToElk(c, index)) as ElkPort[]
                    elkNode.children = snode.children
                        .filter(c => isCell(c))
                        .map(c => this.transformToElk(c, index)) as ElkNode[]
                    elkNode.edges = snode.children
                        .filter(c => isNet(c))
                        .map(c => this.transformToElk(c, index)) as ElkEdge[]
                }
                this.transformShape(elkNode, snode);
                return elkNode
            }
            case 'node:group': {
                const snode = smodel as GroupNodeSchema;
                const elkNode: ElkNode = {
                    id: snode.id,
                    layoutOptions: {
                        'org.eclipse.elk.portConstraints':
                        snode.skin ? 'FIXED_POS' : 'FIXED_SIDE',
                    }
                }
                if (snode.children) {
                    elkNode.ports = snode.children
                        .filter(c => isPin(c))
                        .map(c => this.transformToElk(c, index)) as ElkPort[]
                }
                this.transformShape(elkNode, snode);
                return elkNode;
            }
            case 'port:pin': {
                const sport = smodel as PinPortSchema
                const portConstraint = (() => {
                    switch(sport.side) {
                        case 'top':
                            return 'NORTH'
                        case 'left':
                            return 'WEST'
                        case 'bottom':
                            return 'SOUTH'
                        case 'right':
                            return 'EAST'
                        default:
                            return 'WEST'
                    }
                })()
                const elkPort: ElkPort = {
                    id: sport.id,
                }
                this.transformShape(elkPort, sport)

                if (!sport.fixed) {
                    elkPort.layoutOptions = {
                        'org.eclipse.elk.port.side': portConstraint,
                    }
                    // Ignore label size
                    elkPort.width = 20;
                    elkPort.height = 20;
                }
                return elkPort
            }
            case 'port:port': {
                const sport = smodel as SPortSchema;
                const elkPort: ElkPort = {
                    id: sport.id
                }
                this.transformShape(elkPort, sport)
                return elkPort
            }
            case 'node:cell': {
                const snode = smodel as SNodeSchema;
                const elkNode: ElkNode = {
                    id: snode.id
                }
                if (snode.children) {
                    elkNode.children = snode.children
                        .filter(c => isGroup(c))
                        .map(c => this.transformToElk(c, index)) as ElkNode[]
                }
                this.transformShape(elkNode, snode)
                return elkNode
            }
            case 'net:edge': {
                const sedge = smodel as SEdgeSchema;
                const elkEdge: ElkPrimitiveEdge = {
                    id: sedge.id,
                    source: sedge.sourceId,
                    target: sedge.targetId,
                }
                const points = sedge.routingPoints;
                if (points && points.length >= 2) {
                    elkEdge.sourcePoint = points[0];
                    elkEdge.bendPoints = points.slice(1, points.length - 1);
                    elkEdge.targetPoint = points[points.length - 1];
                }
                return elkEdge
            }
            default:
                throw new Error('Type not supported: ' + smodel.type);
        }
    }

    protected transformShape(elkShape: ElkShape, sshape: SShapeElementSchema) {
        if (sshape.position) {
            elkShape.x = sshape.position.x;
            elkShape.y = sshape.position.y;
        }
        if (sshape.size) {
            elkShape.width = sshape.size.width;
            elkShape.height = sshape.size.height;
        }
    }

    protected applyLayout(elkNode: ElkNode, index: SModelIndex<SModelElementSchema>) {
        const snode = index.getById(elkNode.id);
        if (snode && snode.type.startsWith('node:')) {
            this.applyShape(snode as SNodeSchema, elkNode);
        }
        if (elkNode.children) {
            for (const child of elkNode.children) {
                this.applyLayout(child, index);
            }
        }
        if (elkNode.ports) {
            for (const elkPort of elkNode.ports) {
                const sport = index.getById(elkPort.id);
                this.applyShape(sport as SPortSchema, elkPort)
                if (isPin(sport) && !sport.fixed) {
                    const spin = sport as PinPortSchema
                    // correct coordinates
                    // anchor label correction
                    // top and bottom x += 10
                    // left and right y += 10
                    // anchor left/bottom correction
                    // left.x += 20 / top y -= 20
                    if (spin.side === 'top') {
                        const pos = spin.position || {x: 0, y: 0}
                        spin.position = {x: pos.x + 10, y: pos.y + 20 }
                    }
                    if (spin.side === 'left') {
                        const pos = spin.position || {x: 0, y: 0}
                        spin.position = {x: pos.x + 20, y: pos.y + 10 }
                    }
                    if (spin.side === 'bottom') {
                        const pos = spin.position || {x: 0, y: 0}
                        spin.position = {x: pos.x + 10, y: pos.y }
                    }
                    if (spin.side === 'right') {
                        const pos = spin.position || {x: 0, y: 0}
                        spin.position = {x: pos.x, y: pos.y + 10 }
                    }
                }
            }
        }
        if (elkNode.edges) {
            for (const elkEdge of elkNode.edges) {
                const sedge = index.getById(elkEdge.id);
                if (isNet(sedge)) {
                    this.applyEdge(sedge as SEdgeSchema, elkEdge);
                }
            }
        }
    }

    protected applyShape(sshape: SShapeElementSchema, elkShape: ElkShape) {
        if (elkShape.x !== undefined && elkShape.y !== undefined)
            sshape.position = { x: elkShape.x, y: elkShape.y };
        if (elkShape.width !== undefined && elkShape.height !== undefined)
            sshape.size = { width: elkShape.width, height: elkShape.height };
    }

    protected applyEdge(sedge: SEdgeSchema, elkEdge: ElkEdge) {
        const points: Point[] = [];
        if ((elkEdge as any).sections && (elkEdge as any).sections.length > 0) {
            const section = (elkEdge as ElkExtendedEdge).sections[0];
            if (section.startPoint)
                points.push(section.startPoint);
            if (section.bendPoints)
                points.push(...section.bendPoints);
            if (section.endPoint)
                points.push(section.endPoint);
        } else {
            const section = elkEdge as ElkPrimitiveEdge;
            if (section.sourcePoint)
                points.push(section.sourcePoint);
            if (section.bendPoints)
                points.push(...section.bendPoints);
            if (section.targetPoint)
                points.push(section.targetPoint);
        }
        sedge.routingPoints = points;
    }

}
