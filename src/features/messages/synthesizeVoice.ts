/**
 * 음성 합성(TTS) 관련 유틸리티 모듈.
 * Google Gemini Live API로 전환 후 TTS는 세션 내에서 직접 처리됩니다.
 * 이 모듈은 하위 호환성을 위한 타입 정의만 유지합니다.
 */

import { TalkStyle } from "../messages/messages";

/**
 * @deprecated Gemini Live API 전환 후 TTS는 세션 내에서 처리됩니다.
 * 이 함수는 제거 예정이며 현재 사용되지 않습니다.
 */
export async function synthesizeVoice(
  _message: string,
  _speakerX: number,
  _speakerY: number,
  _style: TalkStyle
): Promise<{}> {
  return {};
}

/**
 * @deprecated Gemini Live API 전환 후 TTS는 세션 내에서 처리됩니다.
 * 이 함수는 제거 예정이며 현재 사용되지 않습니다.
 */
export async function synthesizeVoiceApi(
  _message: string,
  _voiceId: string,
  _style: TalkStyle,
  _apiKey: string
): Promise<{ audio: string }> {
  return { audio: "" };
}
