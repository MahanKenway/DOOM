export class Bitmap {
  readonly width: number;
  readonly height: number;
  readonly data: number[];

  private constructor(width: number, height: number, data: number[]) {
    this.width = width;
    this.height = height;
    this.data = data;
  }

  public static loadFromFile(
    path: string,
    toGrayscale = false,
  ): Promise<Bitmap> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => {
        resolve(Bitmap.createBitmap(image, toGrayscale));
      });
      image.addEventListener("error", () => {
        reject();
      });
      image.src = path;
    });
  }

  private static createBitmap(
    image: HTMLImageElement,
    toGrayscale: boolean,
  ): Bitmap {
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext(
      "2d",
    ) as OffscreenCanvasRenderingContext2D;

    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;

    const rgbData: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const colorValue = toGrayscale
        ? Math.round((r + g + b) / 3)
        : (r << 16) + (g << 8) + b;
      rgbData.push(colorValue);
    }

    return new Bitmap(canvas.width, canvas.height, rgbData);
  }
}
