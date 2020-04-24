attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoords;

uniform mat4 uMVP;
uniform mat4 uNormalMatrix;

varying highp vec2 vTextureCoords;
varying highp vec3 vLighting;

void main() {
    // Positioning and texture
    gl_Position = uMVP * aVertexPosition;
    vTextureCoords = aTextureCoords;

    // Lighting
    highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
    highp vec3 directionalLightColour = vec3(1.0, 1.0, 1.0);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
    highp float direcitonal = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    vLighting = ambientLight + (directionalLightColour * direcitonal);
}