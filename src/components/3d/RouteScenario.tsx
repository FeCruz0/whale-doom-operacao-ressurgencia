"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerPositionRef } from "./FPSControls";

export function RouteScenario() {
  // Let the slope incline angle: Math.atan(0.22) ~ 0.216 rad
  const slopeAngle = Math.atan(0.22);

  useFrame((state) => {
    // Dynamic real-time depth color transition
    const playerZ = playerPositionRef.current.z;
    
    // Map playerZ from 0 (deep sea) to -2000 (shallow beach)
    const pct = THREE.MathUtils.clamp((playerZ - 0) / (-2000 - 0), 0, 1);
    
    // Deep water color (#020617) to crystal turquoise (#0e7490)
    const deepColor = new THREE.Color("#020617");
    const shallowColor = new THREE.Color("#0e7490");
    const interpolatedColor = deepColor.clone().lerp(shallowColor, pct);
    
    state.scene.background = interpolatedColor;
    
    if (state.scene.fog) {
      state.scene.fog.color = interpolatedColor;
      
      // Deep sea is murkier (fog starts closer), shallow is clearer
      const fogNear = THREE.MathUtils.lerp(10, 40, pct);
      const fogFar = THREE.MathUtils.lerp(140, 400, pct);
      
      const fog = state.scene.fog as THREE.Fog;
      fog.near = fogNear;
      fog.far = fogFar;
    }
  });

  return (
    <group>
      {/* ========================================================== */}
      {/* DIAGONAL OCEAN FLOOR SECTIONS                             */}
      {/* ========================================================== */}
      
      {/* Seafloor 1: Mar Aberto (Z: -450 to 30) */}
      {/* Midpoint Z: -210, Y: 6.2, Pitch Rotation matches slope */}
      <mesh position={[0, 6.2 - 45, -210]} rotation={[-Math.PI / 2 + slopeAngle, 0, 0]}>
        <planeGeometry args={[200, 500]} />
        <meshStandardMaterial color="#0b1329" roughness={0.9} />
      </mesh>

      {/* Seafloor 2: Pontal (Z: -1000 to -450) */}
      {/* Midpoint Z: -725, Y: 119.5 */}
      <mesh position={[0, 119.5 - 45, -725]} rotation={[-Math.PI / 2 + slopeAngle, 0, 0]}>
        <planeGeometry args={[200, 600]} />
        <meshStandardMaterial color="#0d1527" roughness={0.9} />
      </mesh>

      {/* Seafloor 3: Boqueirão (Z: -1600 to -1000) */}
      {/* Midpoint Z: -1300, Y: 246 */}
      <mesh position={[0, 246 - 45, -1300]} rotation={[-Math.PI / 2 + slopeAngle, 0, 0]}>
        <planeGeometry args={[100, 650]} />
        <meshStandardMaterial color="#020617" roughness={1.0} />
      </mesh>

      {/* Seafloor 4: Arraial (Z: -2050 to -1600) */}
      {/* Midpoint Z: -1825, Y: 361.5 */}
      <mesh position={[0, 361.5 - 45, -1825]} rotation={[-Math.PI / 2 + slopeAngle, 0, 0]}>
        <planeGeometry args={[200, 500]} />
        {/* Golden sandy beach floor near surface */}
        <meshStandardMaterial color="#eab308" roughness={0.55} emissive="#a16207" emissiveIntensity={0.25} />
      </mesh>

      {/* ========================================================== */}
      {/* SECTION 2: PONTAIS DO ATALAIA (Z: -1000 to -450)           */}
      {/* ========================================================== */}
      {/* Columns manual Y coordinate matching the slope baseline: Y = -40 + (-z * 0.22) */}
      
      {/* Left Columns */}
      <mesh position={[-60, 45, -550]}>
        <cylinderGeometry args={[10, 15, 150, 8]} />
        <meshStandardMaterial color="#27272a" roughness={0.9} />
      </mesh>
      <mesh position={[-50, 101, -800]}>
        <cylinderGeometry args={[12, 18, 170, 8]} />
        <meshStandardMaterial color="#18181b" roughness={0.9} />
      </mesh>

      {/* Right Columns */}
      <mesh position={[60, 78, -700]}>
        <cylinderGeometry args={[11, 16, 160, 8]} />
        <meshStandardMaterial color="#27272a" roughness={0.9} />
      </mesh>
      <mesh position={[55, 134, -950]}>
        <cylinderGeometry args={[13, 19, 180, 8]} />
        <meshStandardMaterial color="#18181b" roughness={0.9} />
      </mesh>

      {/* ========================================================== */}
      {/* SECTION 3: ESTREITO DO BOQUEIRÃO (Z: -1600 to -1000)      */}
      {/* ========================================================== */}
      {/* Narrow canyon walls segments flanking closely. Left/Right X = 32 */}
      
      {/* Segment 1: Z = -1100, Y ~ 202 */}
      <group position={[0, 202, -1100]}>
        <mesh position={[-32, 0, 0]}>
          <boxGeometry args={[14, 150, 200]} />
          <meshStandardMaterial color="#1c1917" roughness={0.95} />
        </mesh>
        <mesh position={[32, 0, 0]}>
          <boxGeometry args={[14, 150, 200]} />
          <meshStandardMaterial color="#1c1917" roughness={0.95} />
        </mesh>
      </group>

      {/* Segment 2: Z = -1300, Y ~ 246 */}
      <group position={[0, 246, -1300]}>
        <mesh position={[-30, 0, 0]}>
          <boxGeometry args={[14, 150, 200]} />
          <meshStandardMaterial color="#1c1917" roughness={0.95} />
        </mesh>
        <mesh position={[30, 0, 0]}>
          <boxGeometry args={[14, 150, 200]} />
          <meshStandardMaterial color="#1c1917" roughness={0.95} />
        </mesh>
        {/* Overhead rock arch */}
        <mesh position={[0, 45, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[10, 65, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
      </group>

      {/* Segment 3: Z = -1500, Y ~ 290 */}
      <group position={[0, 290, -1500]}>
        <mesh position={[-32, 0, 0]}>
          <boxGeometry args={[14, 150, 200]} />
          <meshStandardMaterial color="#1c1917" roughness={0.95} />
        </mesh>
        <mesh position={[32, 0, 0]}>
          <boxGeometry args={[14, 150, 200]} />
          <meshStandardMaterial color="#1c1917" roughness={0.95} />
        </mesh>
        {/* Overhead rock arch */}
        <mesh position={[0, 45, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[10, 65, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
      </group>

      {/* ========================================================== */}
      {/* SECTION 4: CHEGADA EM ARRAIAL DO CABO (Z: -2000 to -1600)  */}
      {/* ========================================================== */}
      {/* Sand floor corals with Y coordinate matching the slope */}
      
      {/* Pink Coral: Z = -1700, Y = 339 */}
      <mesh position={[-35, 339 - 35, -1700]}>
        <sphereGeometry args={[5, 8, 8]} />
        <meshStandardMaterial color="#db2777" emissive="#db2777" emissiveIntensity={0.5} />
      </mesh>

      {/* Cyan Coral: Z = -1800, Y = 361 */}
      <mesh position={[35, 361 - 35, -1800]}>
        <dodecahedronGeometry args={[6, 1]} />
        <meshStandardMaterial color="#0891b2" emissive="#0891b2" emissiveIntensity={0.6} />
      </mesh>

      {/* Orange Coral: Z = -1900, Y = 383 */}
      <mesh position={[-15, 383 - 35, -1900]}>
        <torusGeometry args={[4, 1.5, 8, 16]} />
        <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.5} />
      </mesh>

      {/* ========================================================== */}
      {/* ENDPOINT PORTAL GATEWAY (Z: -1980, Y ~ 395)                */}
      {/* ========================================================== */}
      <group position={[0, 395.6 - 15, -1980]}>
        {/* Left pillar */}
        <mesh position={[-25, 0, 0]}>
          <boxGeometry args={[5, 60, 5]} />
          <meshStandardMaterial color="#06b6d4" emissive="#22d3ee" emissiveIntensity={0.8} />
        </mesh>
        {/* Right pillar */}
        <mesh position={[25, 0, 0]}>
          <boxGeometry args={[5, 60, 5]} />
          <meshStandardMaterial color="#06b6d4" emissive="#22d3ee" emissiveIntensity={0.8} />
        </mesh>
        {/* Top arch beam */}
        <mesh position={[0, 30, 0]}>
          <boxGeometry args={[55, 5, 5]} />
          <meshStandardMaterial color="#06b6d4" emissive="#22d3ee" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}
