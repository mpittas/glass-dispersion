import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Torus,
  Environment,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { PointLightHelper } from "three";
import { useHelper } from "@react-three/drei";

// 1. Define the shaders
const vertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vUv = uv;
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-modelViewPosition.xyz);
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewPosition;
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

uniform sampler2D tMatCap1; // glass-texture.png
uniform sampler2D tMatCap2; // grain.png

vec2 matcapUV(vec3 eye, vec3 normal) {
  vec3 r = reflect(eye, normal);
  float m = 2.82842712474619 * sqrt(r.z + 1.0);
  return r.xy / m + 0.5;
}

// Screen blending function
vec3 screen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

void main() {
  vec2 uv = matcapUV(vViewDir, vNormal);
  
  vec3 color1 = texture2D(tMatCap1, uv).rgb;
  vec3 color2 = texture2D(tMatCap2, uv).rgb;
  
  // Blend the two colors using screen mode
  vec3 finalColor = screen(color1, color2);
  
  gl_FragColor = vec4(finalColor, 1.0); // Assuming full opacity
}
`;

// Define props interface for the component
interface DoubleMatCapMaterialProps {
  matcap1: THREE.Texture;
  matcap2: THREE.Texture;
  side?: THREE.Side;
}

// Create a normal React component instead of using extend/JSX
function DoubleMatCapMaterial({
  matcap1,
  matcap2,
  side = THREE.DoubleSide,
}: DoubleMatCapMaterialProps) {
  // Create material on first render
  const material = useRef<THREE.ShaderMaterial | undefined>(undefined);
  if (!material.current) {
    material.current = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tMatCap1: { value: matcap1 },
        tMatCap2: { value: matcap2 },
      },
      side,
    });
  }

  // Update uniforms when props change
  if (material.current) {
    material.current.uniforms.tMatCap1.value = matcap1;
    material.current.uniforms.tMatCap2.value = matcap2;
    material.current.side = side;
  }

  return <primitive object={material.current} attach="material" />;
}

function Donut() {
  const meshRef = useRef<THREE.Mesh>(null!);
  // Load BOTH textures
  const [matcapTexture1, matcapTexture2] = useTexture([
    "/glass-texture.png",
    "/grain.png",
  ]);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <Torus ref={meshRef} args={[1, 0.4, 64, 128]} scale={0.7}>
      <DoubleMatCapMaterial
        matcap1={matcapTexture1}
        matcap2={matcapTexture2}
        side={THREE.DoubleSide}
      />
    </Torus>
  );
}

function Lights() {
  const pointLightRef1 = useRef<THREE.PointLight>(null!);
  const pointLightRef2 = useRef<THREE.PointLight>(null!);

  useHelper(pointLightRef1, PointLightHelper, 0.5, "cyan");
  useHelper(pointLightRef2, PointLightHelper, 0.5, "magenta");

  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight
        ref={pointLightRef1}
        position={[10, 10, 10]}
        intensity={0.5}
      />
      <pointLight
        ref={pointLightRef2}
        position={[-10, -10, -5]}
        intensity={0.3}
      />
    </>
  );
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <Suspense fallback={null}>
        <Lights />
        <Donut />
        <Environment preset="sunset" />
      </Suspense>
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}
