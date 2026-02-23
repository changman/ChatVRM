import { wait } from "@/utils/wait";
import { Viewer } from "../vrmViewer/viewer";
import { Screenplay } from "./messages";

/**
 * 음성 재생 직렬화 함수 생성기.
 * Gemini Live API에서 수신한 오디오 버퍼를 순서대로 재생하며
 * 립싱크 및 감정 표현을 함께 처리합니다.
 */
const createSpeakCharacter = () => {
  let lastTime = 0;
  let prevFetchPromise: Promise<unknown> = Promise.resolve();
  let prevSpeakPromise: Promise<unknown> = Promise.resolve();

  return (
    screenplay: Screenplay,
    viewer: Viewer,
    audioBuffer: ArrayBuffer,
    onStart?: () => void,
    onComplete?: () => void
  ) => {
    const fetchPromise = prevFetchPromise.then(async () => {
      return audioBuffer;
    });

    prevFetchPromise = fetchPromise;
    prevSpeakPromise = Promise.all([fetchPromise, prevSpeakPromise]).then(
      ([buffer]) => {
        onStart?.();
        if (!buffer) {
          return;
        }
        return viewer.model?.speak(buffer, screenplay);
      }
    );
    prevSpeakPromise.then(() => {
      onComplete?.();
    });
  };
};

export const speakCharacter = createSpeakCharacter();
