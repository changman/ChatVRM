import { reduceTalkStyle } from "@/utils/reduceTalkStyle";
import { TalkStyle } from "../messages/messages";

export async function synthesizeVoice(
  message: string,
  speakerX: number,
  speakerY: number,
  style: TalkStyle
) {
  //const koeiroRes = await koeiromapV0(message, speakerX, speakerY, style);
  //return { audio: koeiroRes.audio };
  return {};
}

export async function synthesizeVoiceApi(
  message: string,
  voiceId: string,
  style: TalkStyle,
  apiKey: string
) {
  const body = {
    message: message,
    voiceId: voiceId,
    apiKey: apiKey,
  };

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as any;

  return { audio: data.audio };
}
