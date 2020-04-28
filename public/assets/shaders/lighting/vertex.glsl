precision highp float;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexTangent;
attribute vec4 aVertexBiTangent;
attribute vec2 aTextureCoords;

varying vec2 vTextureCoords;
varying vec3 vNormal;
varying vec4 test;
varying vec3 vPosition;

void main()
{
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
    vTextureCoords = aTextureCoords;
    vPosition = vec3(uModelMatrix * aVertexPosition);
    vNormal = vec3(uModelMatrix * vec4(aVertexNormal, 0.0));
    test = aVertexTangent * aVertexBiTangent;
}