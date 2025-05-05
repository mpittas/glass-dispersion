import * as THREE from "three";
import { ReactThreeFiber } from "@react-three/fiber";

// Define props based on the shader uniforms + common material props
type DualMatcapMaterialProps = {
  matcapTexture1?: THREE.Texture | null;
  matcapTexture2?: THREE.Texture | null;
  color?: THREE.ColorRepresentation;
} & Omit<
  ReactThreeFiber.Node<THREE.ShaderMaterial, typeof THREE.ShaderMaterial>,
  "args"
> & { attach?: string };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      dualMatcapMaterial: DualMatcapMaterialProps;
    }
  }
}

// Add this line to ensure it's treated as a module
export {};
