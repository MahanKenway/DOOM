import { Item } from "./item.ts";
import { ItemType } from "./item-types.ts";
import { ItemRenderer } from "./item-renderer.ts";
import { Vector3 } from "../../math/vectors.ts";
import { GameContext } from "../game-context.ts";
import { Sound } from "../audio/sound.ts";

type BoundingRectangle = {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
};

export class Items {
  private static readonly LARGEST_ITEM_RADIUS = 0.75;

  private readonly items: Map<ItemType, Item[]>;
  private readonly itemsWithCollision: Item[];
  private readonly itemsToCollect: Item[];
  private readonly renderer: ItemRenderer;

  constructor(items: Map<ItemType, Item[]>) {
    this.items = items;

    this.itemsWithCollision = [];
    items.forEach((itemsOfType, type) => {
      if (type.hasCollision) {
        this.itemsWithCollision.push(...itemsOfType);
      }
    });

    this.itemsToCollect = [];
    items.forEach((itemsOfType, type) => {
      if (type.isCollectable) {
        this.itemsToCollect.push(...itemsOfType);
      }
    });

    this.renderer = new ItemRenderer();
  }

  public async init(): Promise<void> {
    await this.renderer.init(this.items);
  }

  public draw(): void {
    this.renderer.draw();
  }

  public handleItemCollection(): number {
    let collectedItems = 0;

    const boundingRectangle = this.createBoundingRectangle(
      GameContext.player.position,
      GameContext.player.lastPosition,
    );

    for (const item of this.itemsToCollect) {
      if (
        !item.isCollected &&
        this.isInBoundingRectangle(item, boundingRectangle) &&
        item.hasCollisionDuringMovement(
          item,
          GameContext.player.position,
          GameContext.player.lastPosition,
        )
      ) {
        item.isCollected = true;
        collectedItems++;
      }
    }

    if (collectedItems > 0) {
      GameContext.soundPlayer.playSound(Sound.PICKUP_1);
      GameContext.soundPlayer.playSound(Sound.PICKUP_2);
      GameContext.soundPlayer.playSound(Sound.PICKUP_3);
    }

    return collectedItems;
  }

  public findCollidingItem(
    playerPosition: Vector3,
    lastPlayerPosition: Vector3,
  ): Item | undefined {
    const boundingRectangle = this.createBoundingRectangle(
      playerPosition,
      lastPlayerPosition,
    );

    for (const item of this.itemsWithCollision) {
      if (
        this.isInBoundingRectangle(item, boundingRectangle) &&
        item.hasCollisionDuringMovement(
          item,
          playerPosition,
          lastPlayerPosition,
        )
      ) {
        return item;
      }
    }
  }

  private createBoundingRectangle(
    playerPosition: Vector3,
    lastPlayerPosition: Vector3,
  ): BoundingRectangle {
    return {
      xMin:
        Math.min(playerPosition[0], lastPlayerPosition[0]) -
        Items.LARGEST_ITEM_RADIUS,
      xMax:
        Math.max(playerPosition[0], lastPlayerPosition[0]) +
        Items.LARGEST_ITEM_RADIUS,
      zMin:
        Math.min(playerPosition[2], lastPlayerPosition[2]) -
        Items.LARGEST_ITEM_RADIUS,
      zMax:
        Math.max(playerPosition[2], lastPlayerPosition[2]) +
        Items.LARGEST_ITEM_RADIUS,
    };
  }

  private isInBoundingRectangle(
    item: Item,
    boundingRectangle: BoundingRectangle,
  ): boolean {
    return (
      boundingRectangle.xMin <= item.position[0] &&
      boundingRectangle.xMax >= item.position[0] &&
      boundingRectangle.zMin <= item.position[2] &&
      boundingRectangle.zMax >= item.position[2]
    );
  }
}
