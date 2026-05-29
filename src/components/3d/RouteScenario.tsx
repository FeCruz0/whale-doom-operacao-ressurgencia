"use client";

import { useFrame } from "@react-three/fiber";
import { Color, MathUtils, Fog } from "three";
import { playerPositionRef } from "./FPSControls";
import { getRouteX } from "@/store/useGameStore";
import { useMemo, useRef } from "react";
import {
  CausticsMaterial,
  SeabedMaterial,
} from "./materials/CustomShaders";

export function RouteScenario() {
  // Slope incline angle: Math.atan(0.22) ~ 0.216 rad
  const slopeAngle = Math.atan(0.22);

  const causticsMat = useMemo(() => new CausticsMaterial(), []);

  // Seabed shader instances per section (each with independent uShallowFactor)
  const seabedMats = useMemo(() => {
    return {
      sec1: new SeabedMaterial(),   // Open Ocean — deep mud
      sec2: new SeabedMaterial(),   // Industrial — dark silt
      sec3: new SeabedMaterial(),   // Boqueirão — dark sand
      sec4: new SeabedMaterial(),   // Arraial — warm shallow sand
    };
  }, []);

  // Track shallow factor so fog loop can update seabed uniforms
  const shallowFactorRef = useRef(0);

  // Seabed shallow factors per section (static, set once after mount)
  useMemo(() => {
    seabedMats.sec1.uShallowFactor = 0.25;  // darker gold for deep ocean
    seabedMats.sec2.uShallowFactor = 0.35;  // slightly lighter
    seabedMats.sec3.uShallowFactor = 0.55;  // mid-sand canyon
    seabedMats.sec4.uShallowFactor = 1.0;   // bright warm sandy Arraial
  }, [seabedMats]);




  // Generate 32 extra random rocks scattered on the ocean floor to fill the vast open space
  const decorativeRocks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 32; i++) {
      const z = -40 - (i / 32) * 1900;
      const pathX = getRouteX(z);
      // Scatter widely left and right in the open ocean
      const side = i % 2 === 0 ? -1 : 1;
      const x = pathX + side * (30 + Math.random() * 55);
      const floorY = -45 + (-z * 0.22);
      const size = 6.0 + Math.random() * 12.0;

      // Determine color based on section Z to match the walls/paredões
      let rockColor = "#1a1c1e";
      if (z > -450) {
        rockColor = ["#181a1c", "#1c1e20", "#141517"][i % 3]; // Section 1 deep grey
      } else if (z > -1000) {
        rockColor = ["#1c1d1f", "#141517", "#22252a"][i % 3]; // Section 2 Pontal colors
      } else if (z > -1600) {
        rockColor = "#1a1c1e"; // Section 3 Boqueirão color
      } else {
        rockColor = ["#1a1c1e", "#0d1117"][i % 2]; // Section 4 Arraial colors
      }

      arr.push({
        position: [x, floorY - 40 + size * 0.6, z] as [number, number, number],
        size,
        color: rockColor,
        roughness: 0.95 + Math.random() * 0.04
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    // Dynamic real-time depth color transition
    const playerZ = playerPositionRef.current.z;
    
    // Map playerZ from 0 (deep sea) to -2000 (shallow beach)
    const pct = MathUtils.clamp((playerZ - 0) / (-2000 - 0), 0, 1);
    
    // High premium transition palette matching the 4 game sections
    let targetBg = new Color("#020617"); // Default Deep Sea
    let targetNear = 10;
    let targetFar = 160;

    if (playerZ > -450) {
      // Section 1: Open Ocean (Vibrant transparent Blue)
      const secPct = MathUtils.clamp((playerZ - 0) / (-450 - 0), 0, 1);
      targetBg.lerpColors(new Color("#011326"), new Color("#022340"), secPct);
      targetNear = MathUtils.lerp(15, 30, secPct);
      targetFar = MathUtils.lerp(180, 220, secPct);
    } else if (playerZ > -1000) {
      // Section 2: Industrial Area (Murky brown/dark grey fog)
      const secPct = MathUtils.clamp((playerZ - -450) / (-1000 - -450), 0, 1);
      targetBg.lerpColors(new Color("#022340"), new Color("#1c1b18"), secPct);
      targetNear = MathUtils.lerp(30, 8, secPct); // closed in fog
      targetFar = MathUtils.lerp(220, 90, secPct);
    } else if (playerZ > -1600) {
      // Section 3: Boqueirão Deep Canyon (Dark, deep purple-indigo abyss)
      const secPct = MathUtils.clamp((playerZ - -1000) / (-1600 - -1000), 0, 1);
      targetBg.lerpColors(new Color("#1c1b18"), new Color("#06020f"), secPct);
      targetNear = MathUtils.lerp(8, 20, secPct);
      targetFar = MathUtils.lerp(90, 150, secPct);
    } else {
      // Section 4: Shallow beach / Arraial (Crystal turquoise, god rays vibe)
      const secPct = MathUtils.clamp((playerZ - -1600) / (-2000 - -1600), 0, 1);
      targetBg.lerpColors(new Color("#06020f"), new Color("#004e64"), secPct);
      targetNear = MathUtils.lerp(20, 60, secPct);
      targetFar = MathUtils.lerp(150, 450, secPct);
    }
    
    state.scene.background = targetBg;
    
    const time = state.clock.getElapsedTime();
    causticsMat.uTime = time;

    // Drive seabed animation and dynamic shallow factor for sec4
    seabedMats.sec1.uTime = time;
    seabedMats.sec2.uTime = time;
    seabedMats.sec3.uTime = time;
    seabedMats.sec4.uTime = time;

    // Smoothly ramp uShallowFactor of sec4 when player enters Arraial
    if (playerZ < -1600) {
      const arrPct = MathUtils.clamp((playerZ - -1600) / (-2000 - -1600), 0, 1);
      seabedMats.sec4.uShallowFactor = MathUtils.lerp(
        seabedMats.sec4.uShallowFactor,
        0.85 + arrPct * 0.15,
        0.04
      );
    }

    if (state.scene.fog) {
      state.scene.fog.color = targetBg;
      const fog = state.scene.fog as Fog;
      fog.near = MathUtils.lerp(fog.near, targetNear, 0.05);
      fog.far = MathUtils.lerp(fog.far, targetFar, 0.05);
    }
  });

  return (
    <group>
      {/* ========================================================== */}
      {/* DIAGONAL OCEAN FLOOR SECTIONS — organic SeabedMaterial     */}
      {/* ========================================================== */}
      
      {/* Seafloor 1: Mar Aberto (Z: -450 to 30) — deep caustics + seabed ripples */}
      {/* Midpoint Z: -210, Y: 6.2 */}
      <mesh position={[0, 6.2 - 45, -210]} rotation={[-Math.PI / 2 + slopeAngle, 0, 0]}>
        {/* 48×48 segments = visible micro-relief from shader normals */}
        <planeGeometry args={[380, 500, 48, 48]} />
        {/* Caustics layer on top (rendered first via depthWrite=true by default) */}
        <primitive object={causticsMat} />
      </mesh>
      {/* Secondary seabed ripple plane blended under caustics */}
      <mesh position={[0, 6.2 - 45.5, -210]} rotation={[-Math.PI / 2 + slopeAngle, 0, 0]}>
        <planeGeometry args={[380, 500, 32, 32]} />
        <primitive object={seabedMats.sec1} />
      </mesh>

      {/* Seafloor 2: Zona Industrial (Z: -1000 to -450) — dark silt */}
      {/* Midpoint Z: -725, Y: 119.5 */}
      <mesh position={[0, 119.5 - 45, -725]} rotation={[-Math.PI / 2 + slopeAngle, 0, 0]}>
        <planeGeometry args={[380, 600, 32, 32]} />
        <primitive object={seabedMats.sec2} />
      </mesh>

      {/* Seafloor 3: Boqueirão (Z: -1600 to -1000) — narrow dark sand corridor */}
      {/* Midpoint Z: -1300, Y: 246 */}
      <mesh position={[getRouteX(-1300), 246 - 45, -1300]} rotation={[-Math.PI / 2 + slopeAngle, 0, 0]}>
        <planeGeometry args={[130, 650, 20, 48]} />
        <primitive object={seabedMats.sec3} />
      </mesh>

      {/* Seafloor 4: Arraial do Cabo (Z: -2050 to -1600) — warm shallow sand */}
      {/* Midpoint Z: -1825, Y: 361.5 */}
      <mesh position={[0, 361.5 - 45, -1825]} rotation={[-Math.PI / 2 + slopeAngle, 0, 0]}>
        <planeGeometry args={[380, 500, 40, 40]} />
        {/* SeabedMaterial with uShallowFactor=1: warm duned sand tones, no flat yellow */}
        <primitive object={seabedMats.sec4} />
      </mesh>

      {/* Decorative Scattered Rocks — Matches the color transition of the walls/paredões */}
      {decorativeRocks.map((rock, idx) => (
        <group key={idx} position={rock.position}>
          {/* Primary mass */}
          <mesh castShadow receiveShadow>
            <dodecahedronGeometry args={[rock.size, 0]} />
            <meshStandardMaterial color={rock.color} roughness={rock.roughness} metalness={0.02} />
          </mesh>
          {/* Small accent boulder on top to break silhouette */}
          {idx % 3 === 0 && (
            <mesh
              position={[rock.size * 0.35, rock.size * 0.7, rock.size * -0.2]}
              castShadow
            >
              <icosahedronGeometry args={[rock.size * 0.45, 0]} />
              <meshStandardMaterial color="#0e0f11" roughness={0.95} />
            </mesh>
          )}
        </group>
      ))}

      {/* ========================================================== */}
      {/* SECTION 2: PAREDÕES DO PONTAL (Z: -1000 to -450)           */}
      {/* Two continuous canyon walls — left and right sides          */}
      {/* Wall segments span the whole section with irregular stacked */}
      {/* rock faces. Wall inner edge is ±42 units from path center. */}
      {/* ========================================================== */}

      {/* ─── LEFT WALL ─── */}
      {/* Segment 1 — entrance (Z: -460 to -540), floorY at -500 ≈ 65 */}
      <group position={[getRouteX(-500) - 42, 65 - 28, -500]}>
        <mesh castShadow receiveShadow position={[-17.5, 45, 0]}>
          <boxGeometry args={[35, 110, 115]} />
          <meshStandardMaterial color="#1c1d1f" roughness={0.97} metalness={0.02} />
        </mesh>
        <mesh position={[1, 55, 10]} castShadow>
          <dodecahedronGeometry args={[14, 0]} />
          <meshStandardMaterial color="#22252a" roughness={0.98} />
        </mesh>
        <mesh position={[2, 25, -15]} castShadow>
          <dodecahedronGeometry args={[12, 0]} />
          <meshStandardMaterial color="#141517" roughness={0.96} />
        </mesh>
        <mesh position={[-2, 70, -8]} castShadow>
          <boxGeometry args={[14, 28, 16]} />
          <meshStandardMaterial color="#1a1b1e" roughness={0.98} />
        </mesh>
      </group>

      {/* Segment 2 — mid-left (Z: -560 to -680), floorY at -620 ≈ 91 */}
      <group position={[getRouteX(-620) - 42, 91 - 28, -620]}>
        <mesh castShadow receiveShadow position={[-17.5, 45, 0]}>
          <boxGeometry args={[35, 110, 150]} />
          <meshStandardMaterial color="#18181b" roughness={0.97} metalness={0.02} />
        </mesh>
        <mesh position={[2, 58, 22]} castShadow>
          <dodecahedronGeometry args={[16, 0]} />
          <meshStandardMaterial color="#1c1d1f" roughness={0.98} />
        </mesh>
        <mesh position={[-1, 28, -25]} castShadow>
          <boxGeometry args={[18, 32, 22]} />
          <meshStandardMaterial color="#22252a" roughness={0.97} />
        </mesh>
        <mesh position={[3, 75, -10]} castShadow>
          <dodecahedronGeometry args={[10, 0]} />
          <meshStandardMaterial color="#141517" roughness={0.96} />
        </mesh>
      </group>

      {/* Segment 3 — deep-left (Z: -700 to -840), floorY at -770 ≈ 124 */}
      <group position={[getRouteX(-770) - 42, 124 - 28, -770]}>
        <mesh castShadow receiveShadow position={[-17.5, 45, 0]}>
          <boxGeometry args={[35, 110, 170]} />
          <meshStandardMaterial color="#1c1d1f" roughness={0.97} metalness={0.02} />
        </mesh>
        <mesh position={[-2, 60, 30]} castShadow>
          <dodecahedronGeometry args={[18, 0]} />
          <meshStandardMaterial color="#22252a" roughness={0.98} />
        </mesh>
        <mesh position={[2, 30, -35]} castShadow>
          <dodecahedronGeometry args={[14, 0]} />
          <meshStandardMaterial color="#1a1b1e" roughness={0.96} />
        </mesh>
        <mesh position={[-3, 80, -15]} castShadow>
          <boxGeometry args={[16, 36, 20]} />
          <meshStandardMaterial color="#141517" roughness={0.98} />
        </mesh>
      </group>

      {/* Segment 4 — end-left (Z: -850 to -1000), floorY at -930 ≈ 160 */}
      <group position={[getRouteX(-930) - 42, 160 - 28, -930]}>
        <mesh castShadow receiveShadow position={[-17.5, 45, 0]}>
          <boxGeometry args={[35, 110, 180]} />
          <meshStandardMaterial color="#18181b" roughness={0.97} metalness={0.02} />
        </mesh>
        <mesh position={[1, 63, 28]} castShadow>
          <dodecahedronGeometry args={[15, 0]} />
          <meshStandardMaterial color="#1c1d1f" roughness={0.98} />
        </mesh>
        <mesh position={[-2, 32, -30]} castShadow>
          <boxGeometry args={[20, 38, 24]} />
          <meshStandardMaterial color="#22252a" roughness={0.97} />
        </mesh>
        <mesh position={[3, 85, 5]} castShadow>
          <dodecahedronGeometry args={[12, 0]} />
          <meshStandardMaterial color="#141517" roughness={0.96} />
        </mesh>
      </group>

      {/* ─── RIGHT WALL ─── */}
      {/* Segment 1 — entrance (Z: -460 to -540), floorY at -500 ≈ 65 */}
      <group position={[getRouteX(-500) + 42, 65 - 28, -500]}>
        <mesh castShadow receiveShadow position={[17.5, 45, 0]}>
          <boxGeometry args={[35, 110, 115]} />
          <meshStandardMaterial color="#1c1d1f" roughness={0.97} metalness={0.02} />
        </mesh>
        <mesh position={[-1, 55, -12]} castShadow>
          <dodecahedronGeometry args={[13, 0]} />
          <meshStandardMaterial color="#22252a" roughness={0.98} />
        </mesh>
        <mesh position={[2, 25, 15]} castShadow>
          <dodecahedronGeometry args={[11, 0]} />
          <meshStandardMaterial color="#141517" roughness={0.96} />
        </mesh>
        <mesh position={[-3, 70, 8]} castShadow>
          <boxGeometry args={[14, 24, 14]} />
          <meshStandardMaterial color="#1a1b1e" roughness={0.98} />
        </mesh>
      </group>

      {/* Segment 2 — mid-right (Z: -560 to -680), floorY at -620 ≈ 91 */}
      <group position={[getRouteX(-620) + 42, 91 - 28, -620]}>
        <mesh castShadow receiveShadow position={[17.5, 45, 0]}>
          <boxGeometry args={[35, 110, 150]} />
          <meshStandardMaterial color="#18181b" roughness={0.97} metalness={0.02} />
        </mesh>
        <mesh position={[1, 56, -20]} castShadow>
          <dodecahedronGeometry args={[16, 0]} />
          <meshStandardMaterial color="#1c1d1f" roughness={0.98} />
        </mesh>
        <mesh position={[-2, 28, 22]} castShadow>
          <boxGeometry args={[18, 30, 20]} />
          <meshStandardMaterial color="#22252a" roughness={0.97} />
        </mesh>
        <mesh position={[2, 76, 10]} castShadow>
          <dodecahedronGeometry args={[10, 0]} />
          <meshStandardMaterial color="#141517" roughness={0.96} />
        </mesh>
      </group>

      {/* Segment 3 — deep-right (Z: -700 to -840), floorY at -770 ≈ 124 */}
      <group position={[getRouteX(-770) + 42, 124 - 28, -770]}>
        <mesh castShadow receiveShadow position={[17.5, 45, 0]}>
          <boxGeometry args={[35, 110, 170]} />
          <meshStandardMaterial color="#1c1d1f" roughness={0.97} metalness={0.02} />
        </mesh>
        <mesh position={[-2, 58, -28]} castShadow>
          <dodecahedronGeometry args={[17, 0]} />
          <meshStandardMaterial color="#22252a" roughness={0.98} />
        </mesh>
        <mesh position={[2, 30, 32]} castShadow>
          <dodecahedronGeometry args={[13, 0]} />
          <meshStandardMaterial color="#1a1b1e" roughness={0.96} />
        </mesh>
        <mesh position={[-3, 80, 12]} castShadow>
          <boxGeometry args={[16, 34, 18]} />
          <meshStandardMaterial color="#141517" roughness={0.98} />
        </mesh>
      </group>

      {/* Segment 4 — end-right (Z: -850 to -1000), floorY at -930 ≈ 160 */}
      <group position={[getRouteX(-930) + 42, 160 - 28, -930]}>
        <mesh castShadow receiveShadow position={[17.5, 45, 0]}>
          <boxGeometry args={[35, 110, 180]} />
          <meshStandardMaterial color="#18181b" roughness={0.97} metalness={0.02} />
        </mesh>
        <mesh position={[2, 60, -25]} castShadow>
          <dodecahedronGeometry args={[15, 0]} />
          <meshStandardMaterial color="#1c1d1f" roughness={0.98} />
        </mesh>
        <mesh position={[-2, 32, 28]} castShadow>
          <boxGeometry args={[20, 36, 22]} />
          <meshStandardMaterial color="#22252a" roughness={0.97} />
        </mesh>
        <mesh position={[3, 83, -5]} castShadow>
          <dodecahedronGeometry args={[12, 0]} />
          <meshStandardMaterial color="#141517" roughness={0.96} />
        </mesh>
      </group>


      {/* ========================================================== */}
      {/* HISTORIC SHIPWRECK: 'VAPOR HARLINGEN' (Z: -1780, Y: ~301)  */}
      {/* ========================================================== */}
      {/* Dismantled cargo steamer wreckage elements on golden sand */}
      
      {/* Boiler 1: Left Boiler (Z = -1765, Y = 303, tilted) */}
      <group position={[-15, 303, -1765]} rotation={[0.4, 0.5, -0.6]}>
        {/* Main Steam Cylinder */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[5, 5, 14, 12]} />
          <meshStandardMaterial color="#7c2d12" roughness={0.85} metalness={0.7} /> {/* Rust Brown */}
        </mesh>
        {/* Boiler Cap/Details */}
        <mesh position={[0, 7, 0]} castShadow>
          <cylinderGeometry args={[4.2, 4.2, 1.5, 12]} />
          <meshStandardMaterial color="#9a3412" roughness={0.9} metalness={0.6} />
        </mesh>
        {/* Attached corals */}
        <mesh position={[-3, 4, 3]}>
          <sphereGeometry args={[1.5, 6, 6]} />
          <meshStandardMaterial color="#db2777" emissive="#db2777" emissiveIntensity={0.6} /> {/* Pink brain coral */}
        </mesh>
      </group>

      {/* Boiler 2: Right Boiler (Z = -1795, Y = 299, lying down flat) */}
      <group position={[15, 299, -1795]} rotation={[1.4, -0.3, 0.8]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[4.8, 4.8, 12, 12]} />
          <meshStandardMaterial color="#7c2d12" roughness={0.9} metalness={0.75} />
        </mesh>
        {/* Boiler Cap */}
        <mesh position={[0, -6, 0]} castShadow>
          <cylinderGeometry args={[4.0, 4.0, 1.5, 12]} />
          <meshStandardMaterial color="#451a03" roughness={0.95} />
        </mesh>
        {/* Attached green coral */}
        <mesh position={[3, -2, -3]}>
          <dodecahedronGeometry args={[1.3, 0]} />
          <meshStandardMaterial color="#059669" emissive="#059669" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Hull Rib Clump / Cavernas (Z = -1780, X = 0, Y = 301) */}
      <group position={[0, 301, -1780]}>
        {/* Rib Frame Arch 1 */}
        <mesh position={[-6, 4, 2]} rotation={[0.2, 0.1, 0.35]} castShadow>
          <boxGeometry args={[1.5, 18, 2]} />
          <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.8} /> {/* Rusted steel grey */}
        </mesh>
        {/* Rib Frame Arch 2 */}
        <mesh position={[6, 3, -3]} rotation={[-0.1, -0.2, -0.3]} castShadow>
          <boxGeometry args={[1.5, 16, 2]} />
          <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.8} />
        </mesh>
        {/* Rib Frame Arch 3 (broken arch top) */}
        <mesh position={[0, 9, -1]} rotation={[0, 0, 1.4]} castShadow>
          <boxGeometry args={[1.2, 12, 1.8]} />
          <meshStandardMaterial color="#374151" roughness={0.85} metalness={0.75} />
        </mesh>

        {/* Scattered Cargo Crates and plates within the clump */}
        <mesh position={[-2, -3, -5]} rotation={[0.4, 0.8, 0.1]} castShadow>
          <boxGeometry args={[6, 5, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.95} /> {/* Rotting wooden crate */}
        </mesh>
        <mesh position={[4, -4, 4]} rotation={[-0.5, 0.2, -0.3]} castShadow>
          <boxGeometry args={[5, 4, 5]} />
          <meshStandardMaterial color="#78350f" roughness={0.95} />
        </mesh>

        {/* Orange Coral */}
        <mesh position={[0, -2, 6]}>
          <torusGeometry args={[2.5, 0.9, 8, 12]} />
          <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Scattered plates & debris on the surrounding sand */}
      {/* visualFloorY at z=-1770 = 304.4, z=-1790 = 308.8, z=-1805 = 312.1 */}
      <mesh position={[-25, 305, -1770]} rotation={[0.4, 0.2, 0.9]} castShadow>
        <boxGeometry args={[10, 0.4, 12]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.9} metalness={0.8} />
      </mesh>
      <mesh position={[24, 309, -1790]} rotation={[-0.5, 0.8, 0.1]} castShadow>
        <boxGeometry args={[8, 0.5, 10]} />
        <meshStandardMaterial color="#9a3412" roughness={0.95} metalness={0.7} />
      </mesh>
      <mesh position={[-10, 312, -1805]} rotation={[0.9, -0.4, 0.3]} castShadow>
        <boxGeometry args={[7, 0.3, 8]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.9} metalness={0.8} />
      </mesh>

      {/* School of tiny bioluminescent cyan fish hovering over the shipwreck */}
      <group position={[0, 318, -1780]}>
        {/* Fish 1 */}
        <mesh position={[-5, 2, 4]} rotation={[0.1, 0.4, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.8]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
        {/* Fish 2 */}
        <mesh position={[4, -1, 1]} rotation={[-0.2, -0.2, 0.1]}>
          <boxGeometry args={[0.3, 0.2, 0.8]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
        {/* Fish 3 */}
        <mesh position={[-2, 5, -3]} rotation={[0.3, 0.1, -0.2]}>
          <boxGeometry args={[0.3, 0.2, 0.8]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
        {/* Fish 4 */}
        <mesh position={[2, 3, 5]} rotation={[0.0, 0.3, 0]}>
          <boxGeometry args={[0.25, 0.15, 0.7]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Fish 5 */}
        <mesh position={[-3, -2, -5]} rotation={[-0.1, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.15, 0.7]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Fish 6 */}
        <mesh position={[6, 4, -2]} rotation={[0.2, 0.0, 0.2]}>
          <boxGeometry args={[0.3, 0.2, 0.8]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      </group>

      {/* ========================================================== */}
      {/* SECTION 3: ESTREITO DO BOQUEIRÃO (Z: -1600 to -1000)      */}
      {/* ========================================================== */}
      {/* Dynamic basaltic columnar canyon walls replacing box grids. Hexagonal columns (radial segments = 6) */}
      
      {/* Left Wall Basalt Column Clusters (flanking Z corridor) */}
      <group position={[getRouteX(-1150) - 28, 190, -1150]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[8, 9, 130, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
        <mesh position={[4, 15, -12]} rotation={[0.05, 0, 0.1]} castShadow>
          <cylinderGeometry args={[6, 7, 100, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
        <mesh position={[-3, -10, 10]} rotation={[-0.03, 0, -0.05]} castShadow>
          <cylinderGeometry args={[7, 8, 110, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
      </group>

      {/* Right Wall Basalt Column Clusters */}
      <group position={[getRouteX(-1150) + 28, 190, -1150]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[8, 9, 130, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
        <mesh position={[-4, 10, -10]} rotation={[-0.04, 0, -0.08]} castShadow>
          <cylinderGeometry args={[6, 7, 110, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
      </group>

      {/* Mid-Canyon Segment 2 Basalt columns (Z: -1350) */}
      <group position={[getRouteX(-1350) - 26, 235, -1350]}>
        <mesh castShadow>
          <cylinderGeometry args={[7, 8, 120, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
        <mesh position={[3, -20, -8]} rotation={[0, 0, 0.05]} castShadow>
          <cylinderGeometry args={[9, 9, 80, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
      </group>
      
      <group position={[getRouteX(-1350) + 26, 235, -1350]}>
        <mesh castShadow>
          <cylinderGeometry args={[8, 8, 120, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
      </group>

      {/* Segment 3 Basalt Columns approaching exit (Z: -1550) */}
      <group position={[getRouteX(-1550) - 29, 280, -1550]}>
        <mesh castShadow>
          <cylinderGeometry args={[8, 9, 120, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
      </group>
      <group position={[getRouteX(-1550) + 29, 280, -1550]}>
        <mesh castShadow>
          <cylinderGeometry args={[8, 9, 120, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
      </group>

      {/* ========================================================== */}
      {/* SECTION 4: CHEGADA EM ARRAIAL DO CABO (Z: -2000 to -1600)  */}
      {/* ========================================================== */}
      {/* Sand floor corals aligned exactly to the Y seabed level */}
      
      {/* Pink Coral (Branching Sea Fan / Organ Coral) - Z: -1700, visualFloorY: 289 */}
      <group position={[getRouteX(-1700) - 35, 289, -1700]}>
        {/* Base Rock */}
        <mesh castShadow receiveShadow>
          <dodecahedronGeometry args={[4, 0]} />
          <meshStandardMaterial color="#1f1b24" roughness={0.9} />
        </mesh>
        {/* Main tall tube */}
        <mesh position={[0, 4, 0]} rotation={[0.1, 0, -0.1]} castShadow>
          <cylinderGeometry args={[1.2, 1.8, 8, 6]} />
          <meshStandardMaterial color="#db2777" emissive="#db2777" emissiveIntensity={0.6} roughness={0.3} />
        </mesh>
        {/* Left branch */}
        <mesh position={[-2.5, 3.5, 0.5]} rotation={[0.3, 0, 0.6]} castShadow>
          <cylinderGeometry args={[0.9, 1.3, 6, 6]} />
          <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.8} roughness={0.3} />
        </mesh>
        {/* Right branch */}
        <mesh position={[2.5, 3.0, -0.5]} rotation={[-0.2, 0, -0.6]} castShadow>
          <cylinderGeometry args={[0.8, 1.2, 6, 6]} />
          <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.8} roughness={0.3} />
        </mesh>
        {/* Small bulbs/polyps on tips */}
        <mesh position={[0, 8, -0.1]}>
          <dodecahedronGeometry args={[1.4, 0]} />
          <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[-4.5, 5.5, 0.7]}>
          <dodecahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[4.5, 5.0, -0.7]}>
          <dodecahedronGeometry args={[1.0, 0]} />
          <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Cyan Coral (Crystal Cluster / Anemone Pillars) - Z: -1800, visualFloorY: 311 */}
      <group position={[getRouteX(-1800) + 35, 311, -1800]}>
        {/* Base Rock */}
        <mesh castShadow receiveShadow>
          <dodecahedronGeometry args={[4.5, 0]} />
          <meshStandardMaterial color="#1a202c" roughness={0.95} />
        </mesh>
        {/* Main Crystal Pillar */}
        <mesh position={[0, 4.5, 0]} rotation={[0.2, 0.4, -0.1]} castShadow>
          <coneGeometry args={[1.8, 9, 5]} />
          <meshStandardMaterial color="#0891b2" emissive="#06b6d4" emissiveIntensity={0.7} roughness={0.1} metalness={0.5} />
        </mesh>
        {/* Side Crystal Pillar 1 */}
        <mesh position={[-2.2, 3.2, 1.2]} rotation={[0.4, -0.3, 0.5]} castShadow>
          <coneGeometry args={[1.4, 7, 5]} />
          <meshStandardMaterial color="#0891b2" emissive="#06b6d4" emissiveIntensity={0.8} roughness={0.1} metalness={0.5} />
        </mesh>
        {/* Side Crystal Pillar 2 */}
        <mesh position={[2.0, 3.5, -1.0]} rotation={[-0.3, 0.5, -0.4]} castShadow>
          <coneGeometry args={[1.3, 7.5, 5]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={0.9} roughness={0.1} metalness={0.5} />
        </mesh>
        {/* Small cluster base crystals */}
        <mesh position={[0.5, 1.5, 2.5]} rotation={[0.8, 0.1, 0.2]} castShadow>
          <coneGeometry args={[0.9, 4, 4]} />
          <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Orange Coral - Z: -1900, visualFloorY: 333 */}
      <mesh position={[getRouteX(-1900) - 15, 333, -1900]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 1.5, 8, 16]} />
        <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.5} />
      </mesh>

      {/* ========================================================== */}
      {/* ENDPOINT PORTAL GATEWAY (Z: -1980)                         */}
      {/* Organic basalt arch columns with clean volcanic rock       */}
      {/* ========================================================== */}
      <group position={[getRouteX(-1980), 380.6, -1980]}>
        {/* Left outer basalt column */}
        <mesh position={[-28, -5, 0]} castShadow>
          <cylinderGeometry args={[5.5, 7, 72, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
        {/* Left inner lean — slightly angled inward */}
        <mesh position={[-18, 8, -3]} rotation={[0, 0, 0.08]} castShadow>
          <cylinderGeometry args={[4, 5, 55, 6]} />
          <meshStandardMaterial
            color="#0e1220"
            roughness={0.98}
            metalness={0.02}
          />
        </mesh>

        {/* Right outer basalt column */}
        <mesh position={[28, -5, 0]} castShadow>
          <cylinderGeometry args={[5.5, 7, 72, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
        {/* Right inner lean */}
        <mesh position={[18, 8, -3]} rotation={[0, 0, -0.08]} castShadow>
          <cylinderGeometry args={[4, 5, 55, 6]} />
          <meshStandardMaterial
            color="#0e1220"
            roughness={0.98}
            metalness={0.02}
          />
        </mesh>

        {/* Keystone arch span (horizontal basalt bridge) */}
        <mesh position={[0, 34, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[3.5, 3.5, 58, 6]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>

        {/* Glowing victory orb suspended in the arch center */}
        <mesh position={[0, 34, 0]}>
          <sphereGeometry args={[4.5, 16, 16]} />
          <meshStandardMaterial
            color="#22d3ee"
            emissive="#06b6d4"
            emissiveIntensity={3.5}
            roughness={0.0}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Outer glow ring around the orb */}
        <mesh position={[0, 34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[7, 0.6, 8, 32]} />
          <meshStandardMaterial
            color="#67e8f9"
            emissive="#22d3ee"
            emissiveIntensity={2.0}
            transparent
            opacity={0.7}
          />
        </mesh>
        {/* Secondary tilted ring */}
        <mesh position={[0, 34, 0]} rotation={[0.8, 0, 0]}>
          <torusGeometry args={[9, 0.4, 8, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={1.5}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Small scattered basalt debris at base of columns */}
        <mesh position={[-32, -32, 5]} rotation={[0.3, 1.1, 0.5]} castShadow>
          <dodecahedronGeometry args={[4, 0]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.98} metalness={0.02} />
        </mesh>
        <mesh position={[33, -30, -4]} rotation={[-0.5, 0.7, 0.8]} castShadow>
          <icosahedronGeometry args={[3.5, 0]} />
          <meshStandardMaterial color="#0d1117" roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
}
