import { wait } from "@/utils/wait";
import { synthesizeVoiceApi } from "./synthesizeVoice";
import { Viewer } from "../vrmViewer/viewer";
import { Screenplay } from "./messages";
import { Talk } from "./messages";

const createSpeakCharacter = () => {
  let lastTime = 0;
  let prevFetchPromise: Promise<unknown> = Promise.resolve();
  let prevSpeakPromise: Promise<unknown> = Promise.resolve();

  return (
    screenplay: Screenplay,
    viewer: Viewer,
    apiKey: string,
    onStart?: () => void,
    onComplete?: () => void
  ) => {
    const fetchPromise = prevFetchPromise.then(async () => {
      const now = Date.now();
      if (now - lastTime < 1000) {
        await wait(1000 - (now - lastTime));
      }

      const buffer = await fetchAudio(screenplay.talk, apiKey).catch(
        () => null
      );
      lastTime = Date.now();
      return buffer;
    });

    prevFetchPromise = fetchPromise;
    prevSpeakPromise = Promise.all([fetchPromise, prevSpeakPromise]).then(
      ([audioBuffer]) => {
        onStart?.();
        if (!audioBuffer) {
          return;
        }
        return viewer.model?.speak(audioBuffer, screenplay);
      }
    );
    prevSpeakPromise.then(() => {
      onComplete?.();
    });
  };
};

export const speakCharacter = createSpeakCharacter();

export const fetchAudio = async (
  talk: Talk,
  apiKey: string
): Promise<ArrayBuffer> => {
  console.log("fetchAudio calling synthesizeVoiceApi", { voiceId: talk.voiceId, message: talk.message });
  const ttsVoice = await synthesizeVoiceApi(
    talk.message,
    talk.voiceId,
    talk.style,
    apiKey
  );
  const url = ttsVoice.audio;

  if (url == null || url === "") {
    console.error("fetchAudio: Audio URL is null or empty");
    throw new Error("Something went wrong");
  }

  console.log("fetchAudio got url, fetching audio buffer...");
  const resAudio = await fetch(url);
  const buffer = await resAudio.arrayBuffer();
  console.log("fetchAudio got buffer", buffer.byteLength);
  return buffer;
};
