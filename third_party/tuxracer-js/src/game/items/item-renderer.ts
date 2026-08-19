import { GlContext } from "../../gl/gl-context.ts";
import { ItemType } from "./item-types.ts";
import { Item } from "./item.ts";
import { Textures } from "../../gl/textures.ts";
import { DynamicItemRenderer } from "./dynamic-item-renderer.ts";
import { StaticItemRenderer } from "./static-item-renderer.ts";

export class ItemRenderer {
  public static readonly FLAT_POSITIONS = [
    -0.5, 1, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 0, 0,
  ];
  public static readonly FLAT_TEXTURE_COORDINATES = [0, 0, 1, 0, 0, 1, 1, 1];
  public static readonly FLAT_INDICES = [0, 1, 2, 1, 3, 2];

  public static readonly TREE_POSITIONS = [
    ...ItemRenderer.FLAT_POSITIONS,
    0,
    1,
    -0.5,
    0,
    1,
    0.5,
    0,
    0,
    -0.5,
    0,
    0,
    0.5,
  ];
  public static readonly TREE_TEXTURE_COORDINATES = [
    ...ItemRenderer.FLAT_TEXTURE_COORDINATES,
    ...ItemRenderer.FLAT_TEXTURE_COORDINATES,
  ];
  public static readonly TREE_INDICES = [
    ...ItemRenderer.FLAT_INDICES,
    4,
    5,
    6,
    5,
    6,
    7,
  ];

  private readonly dynamicRenderer: DynamicItemRenderer;
  private readonly staticRenderer: StaticItemRenderer;

  constructor() {
    this.dynamicRenderer = new DynamicItemRenderer();
    this.staticRenderer = new StaticItemRenderer();
  }

  public async init(items: Map<ItemType, Item[]>): Promise<void> {
    const textures = await this.loadItemTextures(items, GlContext.gl);

    const dynamicItems = this.filterDynamicItems(items);
    await this.dynamicRenderer.init(textures, dynamicItems);

    const staticItems = this.filterStaticItems(items);
    await this.staticRenderer.init(textures, staticItems);
  }

  public draw(): void {
    const gl = GlContext.gl;

    gl.disable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

    this.staticRenderer.draw(gl);
    this.dynamicRenderer.draw(gl);
  }

  private filterDynamicItems(
    items: Map<ItemType, Item[]>,
  ): Map<ItemType, Item[]> {
    const dynamicItems: Map<ItemType, Item[]> = new Map();
    items.forEach((itemsOfType, type) => {
      if (!type.isStatic || type.isCollectable) {
        dynamicItems.set(type, itemsOfType);
      }
    });
    return dynamicItems;
  }

  private filterStaticItems(items: Map<ItemType, Item[]>): Item[] {
    const staticItems: Item[] = [];
    items.forEach((itemsOfType, type) => {
      if (type.isStatic && !type.isCollectable) {
        staticItems.push(...itemsOfType);
      }
    });
    return staticItems;
  }

  private async loadItemTextures(
    items: Map<ItemType, Item[]>,
    gl: WebGL2RenderingContext,
  ): Promise<WebGLTexture[]> {
    const textures = [];
    for (const itemType of items.keys()) {
      textures[itemType.glId] = Textures.loadFromFile(
        `assets/items/${itemType.texture}`,
        false,
        gl,
      );
    }
    return await Promise.all(textures);
  }
}
