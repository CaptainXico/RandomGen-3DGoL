// shader.js - Custom shader component for animated cube colors

AFRAME.registerShader('rainbow-cube', {
  schema: {
    time: { type: 'time', is: 'uniform' },
    speed: { type: 'number', default: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform float speed;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      // Create rainbow color based on position and time
      float r = 0.5 + 0.5 * sin(vPosition.x * 0.5 + time * speed);
      float g = 0.5 + 0.5 * sin(vPosition.y * 0.5 + time * speed + 2.094);
      float b = 0.5 + 0.5 * sin(vPosition.z * 0.5 + time * speed + 4.188);
      
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `
});
