precision mediump float;

varying vec2 fragmentTextureCoord;
uniform sampler2D sampler;

void main() {
    gl_FragColor = texture2D(sampler, fragmentTextureCoord);
}