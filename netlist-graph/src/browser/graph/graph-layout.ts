import { injectable, inject } from 'inversify';
import { ELK, ElkNode, ElkGraphElement, ElkEdge, ElkLabel, ElkShape,
         ElkPrimitiveEdge, ElkExtendedEdge, LayoutOptions } from 'elkjs/lib/elk-api';
import { SGraphSchema, SModelIndex, SModelElementSchema, SNodeSchema,
         SShapeElementSchema, SEdgeSchema, SLabelSchema, Point,
         IModelLayoutEngine } from 'sprotty/lib';
import { isNode } from './graph-model';

export type ElkFactory = () => ELK;

export const ElkFactory = Symbol('ElkFactory');

@injectable()
export class ElkGraphLayout implements IModelLayoutEngine {

    protected readonly elk: ELK;

    constructor(@inject(ElkFactory) elkFactory: ElkFactory) {
        this.elk = elkFactory();
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
        const elkGraph = this.transformToElk(graph, index) as ElkNode
        return this.elk.layout(elkGraph).then(result => {
            this.applyLayout(result, index!)
            return graph
        })
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
                        .filter(c => {
                            return c.type === 'node' &&
                                this.filterNode(c as SNodeSchema)
                        })
                        .map(c => this.transformToElk(c, index)) as ElkNode[],
                    edges: sgraph.children
                        .filter(c => {
                            return c.type === 'edge' &&
                                this.filterEdge(c as SEdgeSchema, index)})
                        .map(c => this.transformToElk(c, index)) as ElkEdge[]
                };
            }
            case 'node': {
                const snode = smodel as SNodeSchema;
                const elkNode: ElkNode = { id: snode.id };
                if (snode.children) {
                    elkNode.children = snode.children
                        .filter(c => {
                            return c.type === 'node' &&
                                this.filterNode(c as SNodeSchema)
                        })
                        .map(c => this.transformToElk(c, index)) as ElkNode[];
                    elkNode.edges = snode.children
                        .filter(c => {
                            return c.type === 'edge' &&
                                this.filterEdge(c as SEdgeSchema, index)
                        })
                        .map(c => this.transformToElk(c, index)) as ElkEdge[];
                    elkNode.labels = snode.children
                        .filter(c => c.type === 'label')
                        .map(c => this.transformToElk(c, index)) as ElkLabel[];
                }
                this.transformShape(elkNode, snode);
                return elkNode;
            }
            case 'edge': {
                const sedge = smodel as SEdgeSchema;
                const elkEdge: ElkPrimitiveEdge = {
                    id: sedge.id,
                    source: sedge.sourceId,
                    target: sedge.targetId
                };
                if (sedge.children) {
                    elkEdge.labels = sedge.children
                        .filter(c => c.type === 'label')
                        .map(c => this.transformToElk(c, index)) as ElkLabel[];
                }
                const points = sedge.routingPoints;
                if (points && points.length >= 2) {
                    elkEdge.sourcePoint = points[0];
                    elkEdge.bendPoints = points.slice(1, points.length - 1);
                    elkEdge.targetPoint = points[points.length - 1];
                }
                return elkEdge;
            }
            case 'label': {
                const slabel = smodel as SLabelSchema;
                const elkLabel: ElkLabel = { id: slabel.id, text: slabel.text };
                this.transformShape(elkLabel, slabel);
                return elkLabel;
            }
            default:
                throw new Error('Type not supported: ' + smodel.type);
        }
    }

    protected filterNode(node: SNodeSchema): boolean {
        return true;
    }

    protected filterEdge(edge: SEdgeSchema,
                         index: SModelIndex<SModelElementSchema>): boolean {
        const source = index.getById(edge.sourceId);
        if (!source || isNode(source) && !this.filterNode(source))
            return false;
        const target = index.getById(edge.targetId);
        if (!target || isNode(target) && !this.filterNode(target))
            return false;
        return true;
    }

    protected graphOptions(sgraph: SGraphSchema): LayoutOptions {
        return {
            'elk.algorithm': 'layered',
            'elk.direction': 'UP',
            'elk.edgeRouting': 'POLYLINE'
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
        if (snode && snode.type === 'node') {
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
                if (sedge && sedge.type === 'edge') {
                    this.applyEdge(sedge as SEdgeSchema, elkEdge);
                }
            }
        }
        if (elkNode.labels) {
            for (const elkLabel of elkNode.labels) {
                const slabel = index.getById(elkLabel.id);
                if (slabel && slabel.type === 'label') {
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
