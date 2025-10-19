uniform float time;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    // Add vertex displacement for surface turbulence
    vec3 pos = position;
    float turbulence = sin(time * 2.0 + position.x * 10.0 + position.y * 8.0 + position.z * 12.0) * 0.02;
    pos += normal * turbulence;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}