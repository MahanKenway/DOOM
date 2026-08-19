import { Items } from "./items.ts";
import { Item } from "./item.ts";
import { ItemType, ItemTypes } from "./item-types.ts";
import { Vector3 } from "../../math/vectors.ts";
import { GameContext } from "../game-context.ts";

export namespace ItemsLoader {
  type ItemsDto = {
    items: ItemDto[];
  };

  type ItemDto = {
    type: string;
    x: number;
    z: number;
    height: number;
    diameter: number;
  };

  export async function load(): Promise<Items> {
    const response = await fetch(
      `assets/course/${GameContext.courseConfig.key}/items.json`,
    );
    const itemsDto = (await response.json()) as ItemsDto;

    const items = itemsDto.items.map((itemDto) => mapToItem(itemDto));

    return new Items(groupItemsByType(items));
  }

  function groupItemsByType(items: Item[]): Map<ItemType, Item[]> {
    const map = new Map<ItemType, Item[]>();
    for (const itemType of ItemTypes.INDEX.values()) {
      const itemsByType = items.filter((item) => item.type === itemType);
      if (itemsByType.length > 0) {
        map.set(itemType, itemsByType);
      }
    }
    return map;
  }

  function mapToItem(itemDto: ItemDto): Item {
    const type = mapToType(itemDto.type);
    const position = computeItemPosition(itemDto);
    return new Item(type, position, itemDto.height, itemDto.diameter);
  }

  function computeItemPosition(itemDto: ItemDto): Vector3 {
    const x =
      ((GameContext.course.numFieldsX - itemDto.x) /
        (GameContext.course.numFieldsX - 1)) *
      GameContext.courseConfig.width;
    const z =
      -(
        (GameContext.course.numFieldsY - itemDto.z) /
        (GameContext.course.numFieldsY - 1)
      ) * GameContext.courseConfig.length;
    const y = GameContext.course.findYPosition(x, z);
    return [x, y, z] as Vector3;
  }

  function mapToType(typeName: string): ItemType {
    const type = ItemTypes.INDEX.get(typeName);
    if (!type) {
      throw new Error("Unknown item type: " + typeName);
    }
    return type;
  }
}
