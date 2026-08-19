import { Character } from "./character.ts";
import { Color } from "../../util/color.ts";
import { Vector3, Vectors } from "../../math/vectors.ts";
import { CharacterMaterial } from "./character-material.ts";
import { CharacterNode } from "./character-node.ts";
import { CharacterJoint } from "./character-joint.ts";
import { Matrices, Matrix4 } from "../../math/matrices.ts";
import { MathUtil } from "../../math/math-util.ts";
import { CharacterNodeRenderer } from "./character-node-renderer.ts";
import { Axis } from "../../math/axis.ts";
import { CharacterName } from "./character-name.ts";

export namespace CharacterLoader {
  type CharacterDto = {
    materials: MaterialDto[];
    nodes: NodeDto[];
  };

  type MaterialDto = {
    name: string;
    diffuseColor: Color;
    specularColor: Color;
    specularExponent: number;
  };

  type NodeDto = {
    id: number;
    parentId: number;
    name: string | undefined;
    joint: string | undefined;
    scale: Vector3 | undefined;
    translation: Vector3 | undefined;
    rotation: Vector3 | undefined;
    visibility: number | undefined;
    material: string | undefined;
    shadow: boolean | undefined;
    transformationOrder: string[] | undefined;
  };

  enum TransformationDto {
    TRANS = 1,
    ROT_X,
    ROT_Y,
    ROT_YZ, // rotate around Y axis by Z angle
    ROT_Z,
    SCL,
  }

  export async function load(name: CharacterName): Promise<Character> {
    const response = await fetch(`assets/character/${name}/character.json`);
    const characterDto = (await response.json()) as CharacterDto;

    const materialMap = createMaterialMap(characterDto.materials);
    const nodeMap = createNodeMap(characterDto.nodes, materialMap);
    const hierarchyMap = createHierarchyMap(nodeMap);
    const rootNode = nodeMap.get(0) as CharacterNode;

    return new Character(hierarchyMap, rootNode);
  }

  function createHierarchyMap(
    nodeMap: Map<number, CharacterNode>,
  ): Map<CharacterNode, CharacterNode[]> {
    const map = new Map<CharacterNode, CharacterNode[]>();

    nodeMap.forEach((node) => {
      if (!node.parent) {
        return;
      }

      if (!map.has(node.parent)) {
        map.set(node.parent, []);
      }
      const siblings = map.get(node.parent) as CharacterNode[];
      siblings.push(node);
    });

    return map;
  }

  function createNodeMap(
    nodeDtos: NodeDto[],
    materialMap: Map<string, CharacterMaterial>,
  ): Map<number, CharacterNode> {
    const map = new Map<number, CharacterNode>();
    map.set(0, createRootNode());

    nodeDtos.forEach((nodeDto) => {
      const parent = map.get(nodeDto.parentId) as CharacterNode;
      map.set(nodeDto.id, createCharacterNode(nodeDto, parent, materialMap));
    });

    return map;
  }

  function createRootNode(): CharacterNode {
    return {
      joint: CharacterJoint.ROOT,
      isVisible: false,
      hasShadow: false,
      numSphereDivisions: 0,
      transformation: Matrices.createIdentity(),
    } as CharacterNode;
  }

  function createCharacterNode(
    nodeDto: NodeDto,
    parent: CharacterNode,
    materialMap: Map<string, CharacterMaterial>,
  ): CharacterNode {
    return {
      parent,
      material: getMaterial(nodeDto, materialMap),
      joint: getJoint(nodeDto),
      isVisible: isVisible(nodeDto),
      hasShadow: !!nodeDto.shadow,
      numSphereDivisions: getNumSphereDivisions(nodeDto),
      transformation: computeTransformation(nodeDto),
    } as CharacterNode;
  }

  function getNumSphereDivisions(nodeDto: NodeDto): number | undefined {
    if (!nodeDto.visibility) {
      return undefined;
    }
    return MathUtil.clamp(
      CharacterNodeRenderer.MIN_SPHERE_DIVISIONS,
      nodeDto.visibility,
      CharacterNodeRenderer.MAX_SPHERE_DIVISIONS,
    );
  }

  function isVisible(nodeDto: NodeDto): boolean {
    if (!nodeDto.visibility) {
      return false;
    }
    return nodeDto.visibility > 0;
  }

  function getJoint(nodeDto: NodeDto): CharacterJoint | undefined {
    if (!nodeDto.joint) {
      return undefined;
    }
    const joint = CharacterJoint[nodeDto.joint as keyof typeof CharacterJoint];
    if (!joint) {
      throw new Error(`Unknown joint: ${nodeDto.joint}`);
    }
    return joint;
  }

  function getMaterial(
    nodeDto: NodeDto,
    materialMap: Map<string, CharacterMaterial>,
  ): CharacterMaterial | undefined {
    if (!nodeDto.material) {
      return undefined;
    }
    const material = materialMap.get(nodeDto.material);
    if (!material) {
      throw new Error(`Unknown material: ${nodeDto.material}`);
    }
    return material;
  }

  function computeTransformation(nodeDto: NodeDto): Matrix4 {
    let matrix = Matrices.createIdentity();

    if (!nodeDto.transformationOrder) {
      return matrix;
    }

    const translation = nodeDto.translation ?? Vectors.ZERO;
    const scale = nodeDto.scale ?? Vectors.ZERO;
    const rotation = nodeDto.rotation ?? Vectors.ZERO;

    nodeDto.transformationOrder
      .map(
        (transformation) =>
          TransformationDto[transformation as keyof typeof TransformationDto],
      )
      .map((transformation) => {
        switch (transformation) {
          case TransformationDto.TRANS:
            return Matrices.createTranslation(...translation);

          case TransformationDto.SCL:
            return Matrices.createScaling(...scale);

          case TransformationDto.ROT_X:
            return Matrices.createRotation(rotation[0], Axis.X);

          case TransformationDto.ROT_Y:
            return Matrices.createRotation(rotation[1], Axis.Y);

          case TransformationDto.ROT_Z:
            return Matrices.createRotation(rotation[2], Axis.Z);

          case TransformationDto.ROT_YZ:
            return Matrices.createRotation(rotation[2], Axis.Y);

          default:
            throw new Error(`Unknown transformation: ${transformation}`);
        }
      })
      .forEach((transformationMatrix) => {
        matrix = Matrices.multiply(matrix, transformationMatrix);
      });

    return matrix;
  }

  function createMaterialMap(
    materialDtos: MaterialDto[],
  ): Map<string, CharacterMaterial> {
    return new Map<string, CharacterMaterial>(
      materialDtos.map((materialDto) => [
        materialDto.name,
        {
          diffuseColor: materialDto.diffuseColor,
          specularColor: materialDto.specularColor,
          specularExponent: materialDto.specularExponent,
        } as CharacterMaterial,
      ]),
    );
  }
}
