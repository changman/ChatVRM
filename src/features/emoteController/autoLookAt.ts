import * as THREE from "three";
import { VRM } from "@pixiv/three-vrm";
/**
 * 자동 목선을 제어하는 ​​클래스
 *
 * 사커드는 VRMLookAtSmoother에서 처리하고 있으므로,
 * 더 큰 목선을 움직이려면 여기에 구현합니다.
 */
export class AutoLookAt {
  private _lookAtTarget: THREE.Object3D;
  constructor(vrm: VRM, camera: THREE.Object3D) {
    this._lookAtTarget = new THREE.Object3D();
    camera.add(this._lookAtTarget);

    if (vrm.lookAt) vrm.lookAt.target = this._lookAtTarget;
  }
}
