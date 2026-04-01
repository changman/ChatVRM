/**
 * 전역 디버그 플래그 모듈.
 * 여러 모듈에서 공유하는 디버그/타이밍 로그 활성화 여부를 관리합니다.
 */
export const DebugFlags = {
    /** Gemini Live API 스트리밍 메시지 상세 로그 */
    debugLog: false,
    /** 지연 측정용 타이밍 로그 (⏱️ 1~6) */
    timingLog: false,
};
