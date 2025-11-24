import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  audio: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const message = req.body.message;
  const voiceId = req.body.voiceId;
  const apiKey = req.body.apiKey;

  const body = {
    text: message,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5,
    },
  };

  try {
    console.log("TTS Request:", { voiceId, apiKey: apiKey ? "Present" : "Missing", textLength: message?.length });
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} ${response.statusText}`, errorText);
      res.status(response.status).json({ audio: "", error: errorText });
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    res.status(200).json({ audio: audioDataUrl });
  } catch (error) {
    console.error("TTS Handler Error:", error);
    res.status(500).json({ audio: "", error: String(error) });
  }
}
