/// <reference types="vite/client" />

import * as THREE from "three";
import { ShaderMaterialProps } from "@react-three/fiber";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      doubleMatCapMaterial: ShaderMaterialProps & {
        tMatCap1?: THREE.Texture | null;
        tMatCap2?: THREE.Texture | null;
      };
    }
  }
}
