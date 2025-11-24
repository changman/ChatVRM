import { VRMExpressionManager } from "@pixiv/three-vrm";
import { BLINK_CLOSE_MAX, BLINK_OPEN_MAX } from "./emoteConstants";

/**
 * 자동 깜박임을 제어하는 ​​클래스
 */
export class AutoBlink {
  private _expressionManager: VRMExpressionManager;
  private _remainingTime: number;
  private _isOpen: boolean;
  private _isAutoBlink: boolean;

  constructor(expressionManager: VRMExpressionManager) {
    this._expressionManager = expressionManager;
    this._remainingTime = 0;
    this._isAutoBlink = true;
    this._isOpen = true;
  }

  /**
   * 자동 깜박임을 ON/OFF합니다.
   *
   * 눈이 닫혀있는(blink가 1의) 때 감정 표현을 넣으면 불 자연스러워지므로,
   * 눈이 열리는 시간을 반환하고 그 시간이 지나면 감정 표현을 적용합니다.
   * @param isAuto
   * @returns 눈이 열리는 시간
   */
  public setEnable(isAuto: boolean) {
    this._isAutoBlink = isAuto;

    // 눈이 닫혀있는 경우, 눈이 열리는 시간을 반환합니다.
    if (!this._isOpen) {
      return this._remainingTime;
    }

    return 0;
  }

  public update(delta: number) {
    if (this._remainingTime > 0) {
      this._remainingTime -= delta;
      return;
    }

    if (this._isOpen && this._isAutoBlink) {
      this.close();
      return;
    }

    this.open();
  }

  private close() {
    this._isOpen = false;
    this._remainingTime = BLINK_CLOSE_MAX;
    this._expressionManager.setValue("blink", 1);
  }

  private open() {
    this._isOpen = true;
    this._remainingTime = BLINK_OPEN_MAX;
    this._expressionManager.setValue("blink", 0);
  }
}
