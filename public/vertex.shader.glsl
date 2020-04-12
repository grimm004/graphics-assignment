precision mediump float;

attribute vec3 vertexPosition;
attribute vec2 vertexTextureCoord;

varying vec2 fragmentTextureCoord;

uniform mat4 worldMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    fragmentTextureCoord = vertexTextureCoord;
    gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(vertexPosition, 1.0);
}