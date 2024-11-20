precision mediump float;
varying vec3 vNormal;
varying vec3 vPosition;
uniform vec3 outlineColor;
void main() {
    float intensity = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    vec3 color = mix(outlineColor, vec3(1.0), intensity);
    gl_FragColor = vec4(outlineColor, 1.0);
}