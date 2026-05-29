import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";

// 1. Caustics Shader Material for Section 1 Ocean Floor
export const CausticsMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#0891b2"),
    uDeepColor: new THREE.Color("#0b1329"),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uDeepColor;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      // Wave refraction patterns using sine waves crossing
      vec2 uv = vWorldPosition.xz * 0.08;
      
      float c1 = sin(uv.x * 3.0 + uTime * 1.2) * cos(uv.y * 3.0 - uTime * 1.0);
      float c2 = cos(uv.x * 6.0 - uTime * 1.8) * sin(uv.y * 5.0 + uTime * 1.4);
      float caustics = max(0.0, (c1 + c2) * 0.5);
      
      // Fresnel-like depth fade (so caustics fade out dynamically in deeper areas)
      float depthFade = clamp((vWorldPosition.y + 55.0) / 25.0, 0.2, 1.0);
      
      // Combine caustics highlight on top of deep ocean floor color
      vec3 finalColor = mix(uDeepColor, uColor, caustics * 0.55 * depthFade);
      
      // Add subtle depth glow
      finalColor += uColor * 0.08 * depthFade;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// 2. Bioluminescent Rock Material for Section 3 Canyon Walls
export const BiolumRockMaterial = shaderMaterial(
  {
    uTime: 0,
    uRockColor: new THREE.Color("#1c1917"),
    uGlowColor: new THREE.Color("#22d3ee"),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uRockColor;
    uniform vec3 uGlowColor;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vUv;

    void main() {
      // Procedural glowing veins based on world Z and Y coordinates
      float veinPattern = sin(vWorldPosition.z * 0.35 + sin(vWorldPosition.x * 0.5)) * cos(vWorldPosition.y * 0.3 + uTime * 0.65);
      veinPattern = smoothstep(0.75, 0.96, veinPattern); // Extremely sharp and glowing veins
      
      // Pulsing intensity of bioluminescence over time
      float pulse = sin(uTime * 1.8) * 0.25 + 0.75;
      vec3 glow = uGlowColor * veinPattern * pulse * 2.8;
      
      // Shading based on normal for depth/crevice dark shadows (simulating static AO)
      float shadow = clamp(dot(vNormal, vec3(0.0, 1.0, 0.2)), 0.2, 1.0);
      vec3 rockBase = uRockColor * shadow;
      
      gl_FragColor = vec4(rockBase + glow, 1.0);
    }
  `
);

// 3. Oil Slick Iridescent Material for Section 2 Industrial Zone
export const OilSlickMaterial = shaderMaterial(
  {
    uTime: 0,
    uOpacity: 0.7,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // Calculate view vector in view space
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewDir = -mvPosition.xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform float uOpacity;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewDir);
      
      // Fresnel effect
      float fresnel = dot(normal, viewDir);
      fresnel = clamp(1.0 - abs(fresnel), 0.0, 1.0);
      
      // Near-black organic oil with extremely subtle dark edge sheen
      vec3 oilBlack = vec3(0.01, 0.01, 0.012);
      float wave = sin(vUv.x * 6.0 + uTime * 1.4) * cos(vUv.y * 6.0 - uTime * 1.1);
      vec3 edgeSheen = mix(vec3(0.03, 0.02, 0.04), vec3(0.02, 0.04, 0.03), wave * 0.5 + 0.5);
      vec3 finalColor = mix(oilBlack, edgeSheen, fresnel * 0.15);
      
      // Fade out on borders
      gl_FragColor = vec4(finalColor, uOpacity * (0.6 + 0.4 * fresnel));
    }
  `
);

// 4. Organic Seabed Material — procedural sand ripples + depth-aware color blend
export const SeabedMaterial = shaderMaterial(
  {
    uTime: 0,
    // Deep mud/sand (Sec 1 & 2)
    uMudColor: new THREE.Color("#2a1e0e"),
    // Mid sand (Sec 3 Boqueirão)
    uSandColor: new THREE.Color("#8a6b3a"),
    // Shallow warm sand (Sec 4 Arraial)
    uShallowColor: new THREE.Color("#c4a05e"),
    // Blend factor 0=mud/dark gold, 1=bright sandy gold
    uShallowFactor: 0.0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uMudColor;
    uniform vec3 uSandColor;
    uniform vec3 uShallowColor;
    uniform float uShallowFactor;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    varying vec3 vNormal;

    // 2D smooth noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    void main() {
      // World-space UV for tiling (scale independent of mesh size)
      vec2 wUv = vWorldPosition.xz * 0.06;

      // Layered sand ripples (two frequencies, slow drift)
      float ripple1 = noise(wUv * 1.8 + vec2(uTime * 0.015, uTime * 0.008));
      float ripple2 = noise(wUv * 4.5 + vec2(-uTime * 0.012, uTime * 0.02));
      float ripple3 = noise(wUv * 0.6); // large dune shape

      float ripple = ripple1 * 0.45 + ripple2 * 0.30 + ripple3 * 0.25;

      // Dune darkening: crests are lighter, valleys are darker
      float crestLight = smoothstep(0.45, 0.72, ripple);
      float valleyDark = 1.0 - smoothstep(0.0, 0.38, ripple) * 0.45;

      // Base color blend: mud → sand → shallow
      vec3 base = mix(uMudColor, uSandColor, uShallowFactor);
      base = mix(base, uShallowColor, uShallowFactor * uShallowFactor);

      // Apply ripple lighting
      vec3 finalColor = base * valleyDark + base * crestLight * 0.35;

      // Subtle specular glint on wet sand crests (Arraial shallows)
      float glint = pow(crestLight, 3.5) * uShallowFactor * 0.18;
      finalColor += vec3(glint);

      // Normal-based shading (ambient occlusion from slope)
      float ao = clamp(dot(vNormal, vec3(0.0, 1.0, 0.0)), 0.25, 1.0);
      finalColor *= ao;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// 5. Layered Rock Material — sediment veins + crevice AO (no bioluminescence)
export const RockMaterial = shaderMaterial(
  {
    uTime: 0,
    uBaseColor: new THREE.Color("#141618"),
    uVeinColor: new THREE.Color("#2a2218"),
    uCreviceDark: new THREE.Color("#060608"),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform vec3 uVeinColor;
    uniform vec3 uCreviceDark;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    void main() {
      // Layered strata lines along world-Y
      float strata = fract(vWorldPosition.y * 0.15 + noise(vWorldPosition.xz * 0.22) * 0.6);
      float vein = smoothstep(0.82, 0.96, strata);

      // Crevice ambient occlusion: darkens where normal points sideways
      float ao = pow(clamp(dot(vNormal, vec3(0.0, 1.0, 0.0)), 0.0, 1.0), 0.5);
      ao = mix(0.1, 1.0, ao);

      // Micro surface roughness variation
      float micro = noise(vWorldPosition.xz * 3.8 + vWorldPosition.y * 2.1);

      vec3 col = mix(uBaseColor, uVeinColor, vein);
      col = mix(uCreviceDark, col, ao);
      col += (micro - 0.5) * 0.04;
      col = clamp(col, 0.0, 1.0);

      gl_FragColor = vec4(col, 1.0);
    }
  `
);

// Register components in Three JSX namespace
extend({ CausticsMaterial, BiolumRockMaterial, OilSlickMaterial, SeabedMaterial, RockMaterial });

// Declare typings for typescript JSX compilation
declare global {
  namespace JSX {
    interface IntrinsicElements {
      causticsMaterial: any;
      biolumRockMaterial: any;
      oilSlickMaterial: any;
      seabedMaterial: any;
      rockMaterial: any;
    }
  }
}
