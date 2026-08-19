import { CharacterNode } from "./character-node.ts";
import { CharacterNodeRenderer } from "./character-node-renderer.ts";
import { GlContext } from "../../gl/gl-context.ts";
import { Matrix4 } from "../../math/matrices.ts";
import { CharacterJoint } from "./character-joint.ts";

export class Character {
  private readonly hierarchyMap: Map<CharacterNode, CharacterNode[]>;
  private readonly rootNode: CharacterNode;

  private readonly nodeRenderer: CharacterNodeRenderer;

  constructor(
    hierarchyMap: Map<CharacterNode, CharacterNode[]>,
    rootNode: CharacterNode,
  ) {
    this.hierarchyMap = hierarchyMap;
    this.rootNode = rootNode;

    this.nodeRenderer = new CharacterNodeRenderer();
  }

  public async init(): Promise<void> {
    await this.nodeRenderer.init();
  }

  public draw(jointTransitions: Map<CharacterJoint, Matrix4>): void {
    this.nodeRenderer.prepareDrawing();
    this.drawNode(this.rootNode, jointTransitions);
  }

  private drawNode(
    node: CharacterNode,
    jointTransitions: Map<CharacterJoint, Matrix4>,
  ) {
    GlContext.modelViewMatrix.push();
    GlContext.modelViewMatrix.multiply(
      this.getNodeTransformation(node, jointTransitions),
    );

    if (node.isVisible) {
      this.nodeRenderer.draw(node);
    }

    const children = this.hierarchyMap.get(node);
    if (children) {
      children.forEach((childNode) => {
        this.drawNode(childNode, jointTransitions);
      });
    }

    GlContext.modelViewMatrix.pop();
  }

  private getNodeTransformation(
    node: CharacterNode,
    jointTransitions: Map<CharacterJoint, Matrix4>,
  ): Matrix4 {
    if (jointTransitions && node.joint) {
      return jointTransitions.get(node.joint) ?? node.transformation;
    }
    return node.transformation;
  }
}
