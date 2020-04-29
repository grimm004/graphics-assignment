precision highp float;

uniform vec3 uAmbientColour;
uniform vec3 uLightColour;
uniform vec3 uLightPosition;
uniform vec3 uEyePosition;

varying vec3 vColour;
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

    // Ambient, Diffuse and Specular
    vec3 lightColour = uAmbientColour + ((diffuse + specularity) * uLightColour);

    // Ambient, Diffuse, Specular, Colour and Texture
    gl_FragColor = vec4(lightColour * vColour, 1.0);
}