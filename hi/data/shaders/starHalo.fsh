uniform float time;
uniform vec3 color;
uniform float brightness;
varying vec2 vUv;

void main() {
    // Calculate distance from center
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);
    
    // Create soft circular glow
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    
    // Add time-based pulsing
    float pulse = 1.0 + sin(time * 3.0) * 0.1;
    glow *= pulse;
    
    // Apply color and brightness
    vec3 finalColor = color * brightness * glow;
    
    // Add slight chromatic aberration at edges
    float aberration = smoothstep(0.4, 0.5, dist) * 0.1;
    finalColor.r *= 1.0 + aberration;
    finalColor.b *= 1.0 - aberration;
    
    gl_FragColor = vec4(finalColor, glow);
}