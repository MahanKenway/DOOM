import { Shaders } from "../gl/shaders.ts";
import { GameContext } from "./game-context.ts";

export type ShaderLightSettings = {
  useMaterial: boolean;
  useStaticNormal: boolean;
  useNormalMatrix: boolean;
};

export namespace ShaderFactory {
  const COMPUTE_LIGHT_FUNCTION = `
vec3 computeLight(in vec3 eyeNormal, in vec3 viewDirection, in vec3 lightDirection, in vec3 ambientColor, in vec3 diffuseColor, in vec3 specularColor) {
  vec3 eyeLightDirection = normalize(mat3(u_ViewMatrix) * lightDirection);
  
  float diffuseFactor = max(dot(eyeNormal, eyeLightDirection), 0.0);
  
  vec3 halfwayDirection = normalize(eyeLightDirection + viewDirection);
  float specularFactor = pow(max(dot(eyeNormal, halfwayDirection), 0.0), $$specular-exponent$$);

  return $$light-terms-sum$$;
}
  `;

  const COMPUTE_ALL_LIGHTS_FUNCTION = `
vec3 computeAllLights(in vec4 eyePosition) {
  mat3 normalMatrix = $$normal-matrix$$;
  vec3 eyeNormal = normalize(normalMatrix * $$normal-expression$$);
  
  vec3 viewDirection = normalize(-eyePosition.xyz);

  $$light-color-assignments$$
  
  return clamp($$light-color-sum$$, 0.0, 1.0);
}
  `;

  const COMPUTE_FOG_FACTOR_FUNCTION = `
float computeFogFactor(in vec4 eyePosition) {
  float distance = length(eyePosition.xyz);
  return clamp((distance - $$fog-start$$) / $$fog-length$$, 0.0, 1.0);
}
  `;

  const COMPUTE_FINAL_COLOR_FUNCTION = `
vec4 computeFinalColor(in vec4 color) {
  vec4 colorWithLight = vec4(color.rgb * v_LightColor, color.a);
  return mix(colorWithLight, $$fog-color$$, v_FogFactor);
}
  `;

  export function createShader(
    vertexShaderSource: string,
    fragmentShaderSource: string,
    shaderLightSettings: ShaderLightSettings,
    gl: WebGL2RenderingContext,
  ): WebGLProgram {
    const vertexShaderFunctions =
      createComputeLightFunction(shaderLightSettings) +
      createComputeAllLightsFunction(shaderLightSettings) +
      createComputeFogFactorFunction();
    vertexShaderSource = replacePlaceholders(
      vertexShaderSource,
      new Map([["lighting-function", vertexShaderFunctions]]),
    );

    fragmentShaderSource = replacePlaceholders(
      fragmentShaderSource,
      new Map([["lighting-function", createComputeFinalColorFunction()]]),
    );

    return Shaders.loadFromString(vertexShaderSource, fragmentShaderSource, gl);
  }

  function createComputeFinalColorFunction(): string {
    return replacePlaceholders(
      COMPUTE_FINAL_COLOR_FUNCTION,
      new Map([["fog-color", toVec4(...GameContext.environment.fog.color)]]),
    );
  }

  function createComputeFogFactorFunction(): string {
    const fogLength =
      GameContext.environment.fog.end - GameContext.environment.fog.start;
    return replacePlaceholders(
      COMPUTE_FOG_FACTOR_FUNCTION,
      new Map([
        ["fog-start", toFloat(GameContext.environment.fog.start)],
        ["fog-length", toFloat(fogLength)],
      ]),
    );
  }

  function createComputeLightFunction(
    shaderLightSettings: ShaderLightSettings,
  ): string {
    if (shaderLightSettings.useMaterial) {
      return replacePlaceholders(
        COMPUTE_LIGHT_FUNCTION,
        new Map([
          [
            "light-terms-sum",
            "(ambientColor * u_MaterialDiffuseColor) + diffuseFactor * (diffuseColor * u_MaterialDiffuseColor) + specularFactor * (specularColor * u_MaterialSpecularColor)",
          ],
          ["specular-exponent", "u_MaterialSpecularExponent"],
        ]),
      );
    } else {
      return replacePlaceholders(
        COMPUTE_LIGHT_FUNCTION,
        new Map([
          [
            "light-terms-sum",
            "ambientColor + diffuseFactor * diffuseColor + specularFactor * specularColor",
          ],
          ["specular-exponent", "SPECULAR_EXPONENT"],
        ]),
      );
    }
  }

  function createComputeAllLightsFunction(
    shaderLightSettings: ShaderLightSettings,
  ): string {
    let lightColorAssignments = "";
    const lightColorVariables: string[] = [];
    for (let i = 0; i < GameContext.environment.lights.length; i++) {
      const light = GameContext.environment.lights[i];
      const lightColorVariable = `light${i}Color`;
      lightColorAssignments += `vec3 ${lightColorVariable} = computeLight(eyeNormal, viewDirection, ${toVec3(...light.position)}, ${toVec3(...light.ambientColor)}, ${toVec3(...light.diffuseColor)}, ${toVec3(...light.specularColor)});\n`;
      lightColorVariables.push(lightColorVariable);
    }

    return replacePlaceholders(
      COMPUTE_ALL_LIGHTS_FUNCTION,
      new Map([
        ["light-color-assignments", lightColorAssignments],
        ["light-color-sum", lightColorVariables.join(" + ")],
        [
          "normal-expression",
          shaderLightSettings.useStaticNormal ? "NORMAL" : "a_Normal",
        ],
        [
          "normal-matrix",
          shaderLightSettings.useNormalMatrix
            ? "mat3(u_NormalMatrix)"
            : "mat3(u_ModelViewMatrix)",
        ],
      ]),
    );
  }

  export function toVec4(x: number, y: number, z: number, w: number): string {
    return `vec4(${toFloat(x)}, ${toFloat(y)}, ${toFloat(z)}, ${toFloat(w)})`;
  }

  /* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]
   @typescript-eslint/no-unused-vars: [1, { vars: 'all', 'argsIgnorePattern': '^_' }] */
  export function toVec3(x: number, y: number, z: number, _?: number): string {
    return `vec3(${toFloat(x)}, ${toFloat(y)}, ${toFloat(z)})`;
  }

  export function toFloat(value: number): string {
    return value.toFixed(2);
  }

  export function replacePlaceholders(
    shaderTemplate: string,
    values: Map<string, string>,
  ): string {
    let result = shaderTemplate;

    values.forEach((value, placeholder) => {
      const wrappedPlaceholder = `$$${placeholder}$$`;
      result = result.replaceAll(wrappedPlaceholder, value);
    });

    return result;
  }
}
