varying vec3 vColor;

void main() {
    // Calculate point shape
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float r = length(xy);
    
    // Soft circular point with exponential falloff
    float alpha = exp(-r * 6.0);
    
    // Apply color with intensity falloff
    vec3 finalColor = vColor * alpha;
    
    gl_FragColor = vec4(finalColor, alpha * 0.8);
}