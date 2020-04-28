precision highp float;

uniform sampler2D uSampler;
uniform vec3 uAmbientColour;
uniform vec3 uLightColour;
uniform vec3 uLightPosition;
uniform vec3 uEyePosition;

varying vec2 vTextureCoords;
varying vec3 vNormal;
varying vec3 vPosition;

void main()
{
    vec3 nNorm = normalize(vNormal);
    vec3 lightVector = normalize(uLightPosition - vPosition);
    vec3 eyeVector = normalize(uEyePosition - vPosition);

    // Diffuse
    float diffuse = clamp(dot(lightVector, nNorm), 0.0, 1.0);

    // Specular
    vec3 reflectedLightVector = reflect(-lightVector, nNorm);
    float specularity = clamp(dot(reflectedLightVector, eyeVector), 0.0, 1.0);
    specularity *= specularity;
    specularity *= specularity;
    specularity *= specularity;

    // Diffuse and Specular
    vec3 lightColour = uAmbientColour + ((diffuse + specularity) * uLightColour);

    // Ambient, Diffuse, Specular and Texture
    vec3 result = lightColour * texture2D(uSampler, vec2(vTextureCoords.x, 1.0 - vTextureCoords.y)).xyz;
    gl_FragColor = vec4(result, 1.0);
    //gl_FragColor = vec4(specularity, specularity, specularity, 1.0) + vec4(0.0 * result, 0.0);
    //gl_FragColor = vec4(lightColour, 1.0) + vec4(0.0 * result, 0.0);
}