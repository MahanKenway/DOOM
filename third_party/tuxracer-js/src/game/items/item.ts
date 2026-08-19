import { ItemType } from "./item-types.ts";
import { Vector3, Vectors } from "../../math/vectors.ts";

export class Item {
  private collisionDiameter: number;
  private collisionRadius: number;

  public type: ItemType;
  public position: Vector3;
  public height: number;
  public diameter: number;

  public isCollected: boolean;

  constructor(
    type: ItemType,
    position: Vector3,
    height: number,
    diameter: number,
  ) {
    this.type = type;
    this.position = position;
    this.height = height;
    this.diameter = diameter;

    this.isCollected = false;
    this.collisionDiameter = this.diameter * this.type.collisionDiameter;
    this.collisionRadius = this.collisionDiameter / 2;
  }

  public hasCollisionDuringMovement(
    item: Item,
    playerPosition: Vector3,
    lastPlayerPosition: Vector3,
  ): boolean {
    if (this.hasCollision(item, playerPosition)) {
      return true;
    }

    const movement = Vectors.subtract(playerPosition, lastPlayerPosition);
    const distance = Vectors.computeLength(movement);
    const numSteps = Math.floor(distance / this.collisionDiameter);
    if (numSteps === 0) {
      return false;
    }

    const step = Vectors.multiply(1 / (numSteps + 1), movement);

    let interpolatedPosition = lastPlayerPosition;
    for (let i = 0; i < numSteps; i++) {
      interpolatedPosition = Vectors.add(interpolatedPosition, step);
      if (this.hasCollision(item, interpolatedPosition)) {
        return true;
      }
    }

    return false;
  }

  private hasCollision(item: Item, position: Vector3): boolean {
    return (
      position[2] - this.collisionRadius < item.position[2] &&
      position[2] + this.collisionRadius > item.position[2] &&
      position[0] - this.collisionRadius < item.position[0] &&
      position[0] + this.collisionRadius > item.position[0] &&
      position[1] < item.position[1] + item.height
    );
  }
}
