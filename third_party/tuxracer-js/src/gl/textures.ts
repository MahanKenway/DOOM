export namespace Textures {
  export function loadFromFile(
    path: string,
    repeatable: boolean,
    gl: WebGL2RenderingContext,
    mipmapEnabled = true,
  ): Promise<WebGLTexture> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => {
        resolve(createTexture(image, repeatable, gl, mipmapEnabled));
      });
      image.addEventListener("error", () => {
        reject();
      });
      image.src = path;
    });
  }

  function createTexture(
    image: HTMLImageElement,
    repeatable: boolean,
    gl: WebGL2RenderingContext,
    mipmapEnabled: boolean,
  ): WebGLTexture {
    const texture: WebGLTexture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const param = repeatable ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, param);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      mipmapEnabled ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    if (mipmapEnabled) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    return texture;
  }

  export function bindTextures(
    textures: WebGLTexture[],
    gl: WebGL2RenderingContext,
  ): void {
    for (let i = 0; i < textures.length; i++) {
      const texture = textures[i];
      if (texture) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texture);
      }
    }
  }
}
