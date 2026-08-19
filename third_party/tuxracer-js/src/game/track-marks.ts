import { GlContext } from "../gl/gl-context.ts";
import { Vector3, Vectors } from "../math/vectors.ts";
import { Textures } from "../gl/textures.ts";
import { GlUtil } from "../gl/gl-util.ts";
import { ShaderFactory, ShaderLightSettings } from "./shader-factory.ts";
import { Shaders } from "../gl/shaders.ts";
import { GameContext } from "./game-context.ts";

type LastTrackMark = {
  leftWingPosition: Vector3;
  leftWingNormal: Vector3;
  rightWingPosition: Vector3;
  rightWingNormal: Vector3;
  playerPosition: Vector3;
  isStart: boolean;
};

export class TrackMarks {
  private static readonly VERTEX_SHADER = `#version 300 es

#define SPECULAR_EXPONENT 1.0

in vec4 a_Position;
in vec3 a_Normal;
in vec2 a_TextureCoordinate;

uniform mat4 u_ModelViewMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

out vec2 v_TextureCoordinate;
out vec3 v_LightColor;

$$lighting-function$$

void main() {
  vec4 eyePosition = u_ViewMatrix * a_Position;
  gl_Position = u_ProjectionMatrix * eyePosition;
  
  v_TextureCoordinate = a_TextureCoordinate;
  
  v_LightColor = computeAllLights(eyePosition);
}
`;

  private static readonly FRAGMENT_SHADER = `#version 300 es
#define TRACKS_ALPHA 0.75
  
precision mediump float;

in vec2 v_TextureCoordinate;
in vec3 v_LightColor;

uniform sampler2D u_texture;

out vec4 outColor;
 
void main() {
  vec4 textureColor = texture(u_texture, v_TextureCoordinate);
  if (textureColor.a < 0.5) {
    discard;
  }
  
  outColor = vec4(textureColor.rgb * v_LightColor, TRACKS_ALPHA);
}
`;

  private static readonly SHADER_LIGHT_SETTINGS: ShaderLightSettings = {
    useMaterial: false,
    useStaticNormal: false,
    useNormalMatrix: false,
  };

  private static readonly MIN_TRACK_DISTANCE = 0.5;
  private static readonly MAX_NUM_TRACK_MARKS = 30;
  private static readonly HALF_TRACK_WIDTH = 0.35;
  private static readonly TRACK_Y_OFFSET = 0.08;
  private static readonly START_TEXTURE_COORDINATES = [
    [0, 0],
    [0.333, 0],
    [0, 1],
    [0.333, 1],
  ];
  private static readonly TRACK_TEXTURE_COORDINATES = [
    [0.333, 0],
    [0.666, 0],
    [0.333, 1],
    [0.666, 1],
  ];
  private static readonly END_TEXTURE_COORDINATES = [
    [0.666, 0],
    [1, 0],
    [0.666, 1],
    [1, 1],
  ];
  private static readonly INDICES = [0, 1, 2, 1, 2, 3];

  private viewMatrixUniformLocation: WebGLUniformLocation;
  private modelViewMatrixUniformLocation: WebGLUniformLocation;
  private projectionMatrixUniformLocation: WebGLUniformLocation;

  private shader: WebGLProgram;
  private texture: WebGLTexture;
  private vertexArray: WebGLVertexArrayObject;
  private dynamicBuffer: WebGLBuffer;

  private numTrackMarks: number;
  private nextTrackMarkIndex: number;
  private lastTrackMark: LastTrackMark | undefined;

  constructor() {
    this.numTrackMarks = 0;
    this.nextTrackMarkIndex = 0;
  }

  public async init(): Promise<void> {
    const gl = GlContext.gl;

    this.shader = ShaderFactory.createShader(
      TrackMarks.VERTEX_SHADER,
      TrackMarks.FRAGMENT_SHADER,
      TrackMarks.SHADER_LIGHT_SETTINGS,
      gl,
    );
    [
      this.viewMatrixUniformLocation,
      this.modelViewMatrixUniformLocation,
      this.projectionMatrixUniformLocation,
    ] = Shaders.getUniformLocations(
      this.shader,
      gl,
      "u_ViewMatrix",
      "u_ModelViewMatrix",
      "u_ProjectionMatrix",
    );
    const [
      positionAttributeLocation,
      normalAttributeLocation,
      textureCoordinateAttributeLocation,
    ] = Shaders.getAttributeLocations(
      this.shader,
      gl,
      "a_Position",
      "a_Normal",
      "a_TextureCoordinate",
    );

    this.vertexArray = GlUtil.createAndBindVertexArray(gl);

    this.dynamicBuffer = GlUtil.createAndBindBuffer(gl);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      TrackMarks.MAX_NUM_TRACK_MARKS * 8 * 4 * 4,
      gl.DYNAMIC_DRAW,
    );

    // positions
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(
      positionAttributeLocation,
      3,
      gl.FLOAT,
      false,
      8 * 4,
      0,
    );

    // normals
    gl.enableVertexAttribArray(normalAttributeLocation);
    gl.vertexAttribPointer(
      normalAttributeLocation,
      3,
      gl.FLOAT,
      false,
      8 * 4,
      3 * 4,
    );

    // texture coordinates
    gl.enableVertexAttribArray(textureCoordinateAttributeLocation);
    gl.vertexAttribPointer(
      textureCoordinateAttributeLocation,
      2,
      gl.FLOAT,
      false,
      8 * 4,
      6 * 4,
    );

    // indices
    GlUtil.bindIndices(this.createIndices(), gl);

    // texture
    this.texture = await Textures.loadFromFile(
      "assets/track-marks.webp",
      false,
      gl,
    );
  }

  public update(): void {
    if (!this.lastTrackMark) {
      if (!this.isTrackMarkNeeded()) {
        return;
      }

      const [
        leftWingPosition,
        leftWingNormal,
        rightWingPosition,
        rightWingNormal,
      ] = this.computeWingPositions();
      this.lastTrackMark = {
        leftWingPosition,
        leftWingNormal,
        rightWingPosition,
        rightWingNormal,
        playerPosition: GameContext.player.position,
        isStart: true,
      };

      return;
    }

    const distance = Vectors.computeLength(
      Vectors.subtract(
        GameContext.player.position,
        this.lastTrackMark.playerPosition,
      ),
    );
    if (distance < TrackMarks.MIN_TRACK_DISTANCE) {
      return;
    }

    const trackEnding = !this.isTrackMarkNeeded();

    const [
      leftWingPosition,
      leftWingNormal,
      rightWingPosition,
      rightWingNormal,
    ] = this.computeWingPositions();

    const textureCoordinates = this.lastTrackMark.isStart
      ? TrackMarks.START_TEXTURE_COORDINATES
      : trackEnding
        ? TrackMarks.END_TEXTURE_COORDINATES
        : TrackMarks.TRACK_TEXTURE_COORDINATES;
    this.updateDynamicBuffer(
      leftWingPosition,
      leftWingNormal,
      rightWingPosition,
      rightWingNormal,
      this.lastTrackMark.leftWingPosition,
      this.lastTrackMark.leftWingNormal,
      this.lastTrackMark.rightWingPosition,
      this.lastTrackMark.rightWingNormal,
      textureCoordinates,
    );

    if (trackEnding) {
      delete this.lastTrackMark;
    } else {
      this.lastTrackMark = {
        leftWingPosition,
        leftWingNormal,
        rightWingPosition,
        rightWingNormal,
        playerPosition: GameContext.player.position,
        isStart: false,
      };
    }
  }

  private isTrackMarkNeeded(): boolean {
    if (GameContext.player.isAirborne) {
      return false;
    }
    return GameContext.course.canHaveTrackMarks(
      GameContext.player.position[0],
      GameContext.player.position[2],
    );
  }

  private computeWingPositions(): [Vector3, Vector3, Vector3, Vector3] {
    const widthVector = Vectors.multiply(
      TrackMarks.HALF_TRACK_WIDTH,
      Vectors.normalize(
        Vectors.computeCrossProduct(
          GameContext.player.direction,
          Vectors.Y_UNIT,
        ),
      ),
    );

    const leftWing = Vectors.subtract(GameContext.player.position, widthVector);
    leftWing[1] =
      GameContext.course.findYPosition(leftWing[0], leftWing[2]) +
      TrackMarks.TRACK_Y_OFFSET;
    const leftWingNormal = GameContext.course.findNormal(
      leftWing[0],
      leftWing[2],
    );

    const rightWing = Vectors.add(GameContext.player.position, widthVector);
    rightWing[1] =
      GameContext.course.findYPosition(rightWing[0], rightWing[2]) +
      TrackMarks.TRACK_Y_OFFSET;
    const rightWingNormal = GameContext.course.findNormal(
      rightWing[0],
      rightWing[2],
    );

    return [leftWing, leftWingNormal, rightWing, rightWingNormal];
  }

  private updateDynamicBuffer(
    p1: Vector3,
    n1: Vector3,
    p2: Vector3,
    n2: Vector3,
    p3: Vector3,
    n3: Vector3,
    p4: Vector3,
    n4: Vector3,
    textureCoordinates: number[][],
  ) {
    const bufferUpdate = [
      ...p1,
      ...n1,
      ...textureCoordinates[0],
      ...p2,
      ...n2,
      ...textureCoordinates[1],
      ...p3,
      ...n3,
      ...textureCoordinates[2],
      ...p4,
      ...n4,
      ...textureCoordinates[3],
    ];

    const gl = GlContext.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicBuffer);
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      this.nextTrackMarkIndex * 8 * 4 * 4,
      new Float32Array(bufferUpdate),
    );

    this.nextTrackMarkIndex =
      (this.nextTrackMarkIndex + 1) % TrackMarks.MAX_NUM_TRACK_MARKS;
    this.numTrackMarks = Math.min(
      this.numTrackMarks + 1,
      TrackMarks.MAX_NUM_TRACK_MARKS,
    );
  }

  public draw(): void {
    if (this.numTrackMarks === 0) {
      return;
    }

    const gl = GlContext.gl;

    gl.disable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

    gl.useProgram(this.shader);

    gl.uniformMatrix4fv(
      this.projectionMatrixUniformLocation,
      false,
      GlContext.perspectiveMatrix,
    );
    gl.uniformMatrix4fv(
      this.viewMatrixUniformLocation,
      false,
      GlContext.viewMatrix,
    );
    gl.uniformMatrix4fv(
      this.modelViewMatrixUniformLocation,
      false,
      GlContext.modelViewMatrix.current,
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.bindVertexArray(this.vertexArray);

    gl.drawElements(gl.TRIANGLES, this.numTrackMarks * 6, gl.UNSIGNED_SHORT, 0);
  }

  private createIndices(): number[] {
    const indices: number[] = [];
    for (let i = 0; i < TrackMarks.MAX_NUM_TRACK_MARKS; i++) {
      const offset = i * 4;
      indices.push(...TrackMarks.INDICES.map((index) => index + offset));
    }
    return indices;
  }
}
