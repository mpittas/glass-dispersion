import { useRef, forwardRef } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import {
  OrbitControls,
  Torus,
  Environment,
  useTexture,
  shaderMaterial,
} from "@react-three/drei";
import * as THREE from "three";
import { PointLightHelper } from "three";
import { useHelper } from "@react-three/drei";

// --- Shader Definition ---
const DualMatcapMaterial = shaderMaterial(
  // Uniforms: pass textures to the shader
  {
    matcapTexture1: null, // glass-texture.png
    matcapTexture2: null, // grain.png
    color: new THREE.Color(0.5, 0.5, 0.5), // Add color uniform (defaulting to gray)
  },
  // Vertex Shader: calculates view direction and normal for matcap lookup
  /*glsl*/ `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader: performs matcap lookup for both textures and blends them
  /*glsl*/ `
    uniform sampler2D matcapTexture1;
    uniform sampler2D matcapTexture2;
    uniform vec3 color; // Receive color uniform
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    // Function to calculate MatCap UVs
    vec2 calculateMatcapUV(vec3 normal, vec3 viewDir) {
        vec3 reflectedView = reflect(normalize(viewDir), normalize(normal));
        float m = 2.8284271247461903 * sqrt(reflectedView.z + 1.0);
        return reflectedView.xy / m + 0.5;
    }
    
    // Screen blend function
    vec3 blendScreen(vec3 base, vec3 blend) {
      return 1.0 - (1.0 - base) * (1.0 - blend);
    }

    void main() {
      vec2 matcapUV = calculateMatcapUV(vNormal, vViewPosition);
      
      vec3 color1 = texture2D(matcapTexture1, matcapUV).rgb;
      vec3 color2 = texture2D(matcapTexture2, matcapUV).rgb;

      // Combine using screen blending
      vec3 blendedMatcapColor = blendScreen(color1, color2);

      // Multiply the blended matcap color by the uniform color
      vec3 finalColor = blendedMatcapColor * color;
      
      gl_FragColor = vec4(finalColor, 1.0); // Use combined color, alpha = 1.0
    }
  `
);

// Make the shaderMaterial available as a JSX component
extend({ DualMatcapMaterial });

// --- Wrapper Component for Type Safety ---
interface DualMatcapWrapperProps {
  matcapTexture1?: THREE.Texture | null;
  matcapTexture2?: THREE.Texture | null;
  color?: THREE.ColorRepresentation;
  // Add other shader material props if needed (e.g., side, transparent)
  side?: THREE.Side;
  transparent?: boolean;
}

// Use forwardRef if you need to pass a ref to the underlying material
const DualMatcapWrapperMaterial = forwardRef<
  THREE.ShaderMaterial,
  DualMatcapWrapperProps
>((props, ref) => {
  // We still need to bypass TS check here, but usage becomes safe
  // @ts-ignore
  return <dualMatcapMaterial ref={ref} attach="material" {...props} />;
});

// --- Component Logic ---
function Donut() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [matcap1, matcap2] = useTexture(["/glass-texture.png", "/grain.png"]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <Torus ref={meshRef} args={[1, 0.4, 32, 100]} scale={0.7}>
      <DualMatcapWrapperMaterial
        matcapTexture1={matcap1}
        matcapTexture2={matcap2}
        color={new THREE.Color(0.5, 0.5, 0.5)}
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
      <Lights />
      <Donut />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      <Environment preset="sunset" />
    </Canvas>
  );
}
