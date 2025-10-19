uniform float time;
varying vec2 vUv;

void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Slight vertex noise for organic feel
    float noise = sin(time * 2.0 + position.x * 10.0) * 0.02;
    pos += normal * noise;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}