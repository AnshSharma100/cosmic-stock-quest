uniform float time;
uniform float rotation;
attribute float size;
attribute vec3 customColor;
varying vec3 vColor;

void main() {
    vColor = customColor;
    
    // Rotate around Y axis
    float c = cos(rotation);
    float s = sin(rotation);
    vec3 pos = position;
    pos.xz = mat2(c, -s, s, c) * pos.xz;
    
    // Add subtle vertical wave motion
    pos.y += sin(time * 0.5 + position.x * 0.02) * 2.0;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = size * (300.0 / -mvPosition.z);
}