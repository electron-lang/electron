import { injectable, inject } from 'inversify';
import { ELK, ElkNode, ElkGraphElement, ElkEdge, ElkLabel, ElkShape, ElkPort,
         ElkPrimitiveEdge, ElkExtendedEdge, LayoutOptions } from 'elkjs/lib/elk-api';
import { SGraphSchema, SModelIndex, SModelElementSchema, SNodeSchema,
         SShapeElementSchema, SEdgeSchema, SLabelSchema, SPortSchema, Point,
         IModelLayoutEngine } from 'sprotty/lib';

export type ElkFactory = () => ELK;

export const ElkFactory = Symbol('ElkFactory');

@injectable()
export class ElkGraphLayout implements IModelLayoutEngine {

    protected readonly elk: ELK;

    constructor(@inject(ElkFactory) elkFactory: ElkFactory) {
        this.elk = elkFactory();
        console.log(this.elk.knownLayoutOptions())
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
        console.log(graph)
        const elkGraph = this.transformToElk(graph, index) as ElkNode
        const newGraph = this.elk.layout(elkGraph).then(result => {
            this.applyLayout(result, index!)
            return graph
        })
        console.log(newGraph)
        return newGraph
    }

    protected transformToElk(smodel: SModelElementSchema,
                             index: SModelIndex<SModelElementSchema>)
    : ElkGraphElement {
        switch (smodel.type) {
            case 'graph': {
                const sgraph = smodel as SGraphSchema;
                return <ElkNode> {
                    id: sgraph.id,
                    layoutOptions: this.graphOptions(sgraph),
                    children: sgraph.children
                        .filter(c => c.type === 'node:group')
                        .map(c => this.transformToElk(c, index)) as ElkNode[],
                }
            }
            case 'node:group': {
                const snode = smodel as SNodeSchema;
                const elkNode: ElkNode = {
                    id: snode.id,
                }
                if (snode.children) {
                    elkNode.labels = snode.children
                        .filter(c => c.type.startsWith('label'))
                        .map(c => this.transformToElk(c, index)) as ElkLabel[]
                    elkNode.children = snode.children
                        .filter(c => c.type === 'node:ports')
                        .map(c => this.transformToElk(c, index)) as ElkNode[]
                }
                this.transformShape(elkNode, snode);
                return elkNode;
            }
            case 'node:ports': {
                const snode = smodel as SNodeSchema;
                const elkNode: ElkNode = {
                    id: snode.id,
                    layoutOptions: {
                        'org.eclipse.elk.portConstraints': 'FIXED_SIDE',
                    }
                }
                if (snode.children) {
                    elkNode.ports = snode.children
                        .filter(c => c.type.startsWith('port'))
                        .map(c => this.transformToElk(c, index)) as ElkPort[]
                    elkNode.labels = snode.children
                        .filter(c => c.type.startsWith('label'))
                        .map(c => this.transformToElk(c, index)) as ElkLabel[]
                }
                this.transformShape(elkNode, snode);
                return elkNode;
            }
            case 'port:top':
            case 'port:left':
            case 'port:bottom':
            case 'port:right': {
                const sport = smodel as SPortSchema
                const portConstraint = (() => {
                    switch(sport.type) {
                        case 'port:top':
                            return 'NORTH'
                        case 'port:left':
                            return 'WEST'
                        case 'port:bottom':
                            return 'SOUTH'
                        case 'port:right':
                            return 'EAST'
                        default:
                            return 'WEST'
                    }
                })()
                const elkPort: ElkPort = {
                    id: sport.id,
                    layoutOptions: {
                        'org.eclipse.elk.port.side': portConstraint,
                    }
                }
                this.transformShape(elkPort, sport)
                return elkPort
            }
            case 'label:group:ref':
            case 'label:group:value': {
                const slabel = smodel as SLabelSchema
                const elkLabel: ElkLabel = {
                    id: slabel.id,
                    text: slabel.text,
                }
                this.transformShape(elkLabel, slabel)
                return elkLabel
            }
            case 'label:port':
            case 'label:port:pad': {
                const slabel = smodel as SLabelSchema
                const elkLabel: ElkLabel = {
                    id: slabel.id,
                    text: slabel.text,
                }
                this.transformShape(elkLabel, slabel)
                return elkLabel
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
        if (elkNode.edges) {
            for (const elkEdge of elkNode.edges) {
                const sedge = index.getById(elkEdge.id);
                if (sedge && sedge.type.startsWith('edge:')) {
                    this.applyEdge(sedge as SEdgeSchema, elkEdge);
                }
            }
        }
        if (elkNode.ports) {
            for (const elkPort of elkNode.ports) {
                const sport = index.getById(elkPort.id);
                if (sport && sport.type.startsWith('port:')) {
                    this.applyShape(sport as SPortSchema, elkPort)
                }
            }
        }
        if (elkNode.labels) {
            for (const elkLabel of elkNode.labels) {
                const slabel = index.getById(elkLabel.id);
                if (slabel && slabel.type.startsWith('label:')) {
                    this.applyShape(slabel as SLabelSchema, elkLabel);
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
