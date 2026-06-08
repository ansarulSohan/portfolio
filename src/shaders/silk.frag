precision highp float;

varying vec2 vUv;

void main() {
  float d = abs(vUv.y - 0.5);
  float glow = smoothstep(0.5, 0.0, d);
  vec3 col = vec3(0.0, 1.0, 0.7);
  gl_FragColor = vec4(col * glow, glow);
}
