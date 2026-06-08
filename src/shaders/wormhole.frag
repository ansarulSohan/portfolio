precision highp float;

uniform float time;
varying vec2 vUv;

void main() {
  vec2 uv = vUv - 0.5;
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  float spiral = sin(a * 10.0 + time * 2.0 - r * 20.0);
  float glow = smoothstep(0.5, 0.0, r) * (0.5 + 0.5 * spiral);
  vec3 col = mix(vec3(0.0, 0.7, 1.0), vec3(1.0, 0.3, 1.0), 0.5 + 0.5 * spiral);
  gl_FragColor = vec4(col * glow, glow);
}
