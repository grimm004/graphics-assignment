varying highp vec2 vTextureCoords;
varying highp vec3 vLighting;

uniform sampler2D uSampler;

void main() {
    highp vec4 texelColour = texture2D(uSampler, vTextureCoords);
    gl_FragColor = vec4(texelColour.rgb, texelColour.a);
}