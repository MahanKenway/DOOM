export type ItemType = {
  texture: string;
  glId: number;
  collisionDiameter: number;
  hasCollision: boolean;
  isFlat: boolean;
  isStatic: boolean;
  isCollectable: boolean;
};

export namespace ItemTypes {
  export const INDEX: Map<string, ItemType> = new Map([
    [
      "SHRUB",
      {
        texture: "shrub.webp",
        glId: 0,
        collisionDiameter: 0.6,
        hasCollision: true,
        isFlat: false,
        isCollectable: false,
        isStatic: true,
      },
    ],
    [
      "TREE",
      {
        texture: "snowy_tree1.webp",
        glId: 1,
        collisionDiameter: 0.4,
        hasCollision: true,
        isFlat: false,
        isCollectable: false,
        isStatic: true,
      },
    ],
    [
      "FLAG",
      {
        texture: "flag.webp",
        glId: 2,
        collisionDiameter: 0,
        hasCollision: false,
        isFlat: true,
        isCollectable: false,
        isStatic: false,
      },
    ],
    [
      "HERRING",
      {
        texture: "herring.webp",
        glId: 3,
        collisionDiameter: 1.5,
        hasCollision: false,
        isFlat: true,
        isCollectable: true,
        isStatic: false,
      },
    ],
    [
      "TREE_BARREN",
      {
        texture: "tree_barren2.webp",
        glId: 4,
        collisionDiameter: 0.4,
        hasCollision: true,
        isFlat: false,
        isCollectable: false,
        isStatic: true,
      },
    ],
    [
      "START",
      {
        texture: "start.webp",
        glId: 5,
        collisionDiameter: 0,
        hasCollision: false,
        isFlat: true,
        isCollectable: false,
        isStatic: true,
      },
    ],
    [
      "FINISH",
      {
        texture: "finish.webp",
        glId: 6,
        collisionDiameter: 0,
        hasCollision: false,
        isFlat: true,
        isCollectable: false,
        isStatic: true,
      },
    ],
  ]);
}
