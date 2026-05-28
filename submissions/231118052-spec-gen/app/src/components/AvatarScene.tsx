import React, { useRef, useEffect, Suspense } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import { useGLTF, useAnimations } from '@react-three/drei/native';
import * as THREE from 'three';
import { Asset } from 'expo-asset';

// Viseme mapping: audio RMS → mouth blend shapes
// ReadyPlayerMe / Avaturn standard viseme keys
const VISEME_MAP: Record<string, number[]> = {
  //     [ jawOpen, mouthSmile, mouthFunnel, mouthPucker, mouthShrugUpper ]
  silent:  [0.00,    0.00,       0.00,         0.00,         0.00],
  a:       [0.85,    0.10,       0.00,         0.00,         0.05],
  e:       [0.45,    0.60,       0.00,         0.00,         0.10],
  i:       [0.30,    0.80,       0.00,         0.00,         0.00],
  o:       [0.70,    0.00,       0.60,         0.00,         0.00],
  u:       [0.50,    0.00,       0.40,         0.70,         0.00],
  f:       [0.10,    0.00,       0.00,         0.00,         0.20],
  m:       [0.00,    0.05,       0.00,         0.00,         0.00],
};

const VISEME_BLEND_KEYS = [
  'jawOpen',
  'mouthSmileLeft',
  'mouthSmileRight',
  'mouthFunnel',
  'mouthPucker',
  'mouthShrugUpper',
];

function getVisemeFromRMS(rms: number): keyof typeof VISEME_MAP {
  if (rms < 0.02) return 'silent';
  if (rms < 0.15) return 'f';
  if (rms < 0.25) return 'm';
  if (rms < 0.35) return 'i';
  if (rms < 0.45) return 'e';
  if (rms < 0.60) return 'u';
  if (rms < 0.75) return 'o';
  return 'a';
}

interface AvatarModelProps {
  rms: number;
  isSpeaking: boolean;
}

function AvatarModel({ rms, isSpeaking }: AvatarModelProps) {
  const meshRef = useRef<THREE.Group>(null!);
  const currentVisemeRef = useRef<number[]>(VISEME_MAP['silent']);

  // Load the .glb — user places their avatar.glb in assets/models/
  // Falls back to a primitive head shape if file missing
  let scene: THREE.Group | null = null;
  let nodes: Record<string, any> = {};

  try {
    const gltf = useGLTF(require('../../assets/models/avatar.glb'));
    scene = gltf.scene;
    nodes = gltf.nodes as Record<string, any>;
  } catch {
    // File not yet present
  }

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Idle head bob
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;

    // Lipsync: interpolate towards target viseme
    const targetVisemeName = getVisemeFromRMS(rms);
    const targetViseme = VISEME_MAP[targetVisemeName];
    const lerp = isSpeaking ? 0.25 : 0.1; // faster when speaking

    const interpolated = currentVisemeRef.current.map((cur, i) =>
      cur + (targetViseme[i] - cur) * lerp
    );
    currentVisemeRef.current = interpolated;

    // Apply to morph targets on all skinned meshes
    if (scene) {
      scene.traverse((obj) => {
        if (obj instanceof THREE.SkinnedMesh && obj.morphTargetDictionary) {
          const dict = obj.morphTargetDictionary;
          const infl = obj.morphTargetInfluences;
          if (!infl) return;

          const applyMorph = (key: string, value: number) => {
            const idx = dict[key];
            if (idx !== undefined) infl[idx] = value;
          };

          applyMorph('jawOpen', interpolated[0]);
          applyMorph('mouthSmileLeft', interpolated[1] * 0.8);
          applyMorph('mouthSmileRight', interpolated[1]);
          applyMorph('mouthFunnel', interpolated[3]);
          applyMorph('mouthPucker', interpolated[4]);
          applyMorph('mouthShrugUpper', interpolated[5]);
        }
      });
    }
  });

  if (!scene) {
    // Placeholder: simple head geometry
    return (
      <group ref={meshRef} position={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#c8a882" />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.35, 0.2, 0.92]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.35, 0.2, 0.92]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        {/* Mouth - morphs with RMS */}
        <mesh position={[0, -0.35, 0.93]} scale={[1, Math.max(0.05, rms * 1.5), 1]}>
          <boxGeometry args={[0.4, 0.15, 0.05]} />
          <meshStandardMaterial color="#8B2635" />
        </mesh>
      </group>
    );
  }

  return (
    <primitive
      ref={meshRef}
      object={scene}
      scale={2.2}
      position={[0, -1.8, 0]}
    />
  );
}

function Scene({ rms, isSpeaking }: AvatarModelProps) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} castShadow />
      <pointLight position={[-2, 2, 2]} intensity={0.4} color="#00aaff" />
      {/* Rim light for dramatic effect */}
      <pointLight position={[0, 0, -3]} intensity={0.3} color="#ff4400" />
      <Suspense fallback={null}>
        <AvatarModel rms={rms} isSpeaking={isSpeaking} />
      </Suspense>
    </>
  );
}

interface AvatarSceneProps {
  rms: number;
  isSpeaking: boolean;
}

export function AvatarScene({ rms, isSpeaking }: AvatarSceneProps) {
  return (
    <View style={styles.container}>
      <Canvas
        style={styles.canvas}
        camera={{ position: [0, 0.5, 3.5], fov: 35 }}
        gl={{ antialias: true }}
      >
        <Scene rms={rms} isSpeaking={isSpeaking} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
    borderRadius: 16,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
});
