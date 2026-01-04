
export async function getSpeechToText(audio: Blob, apiKey: string): Promise<string> {
    if (!apiKey) {
        throw new Error("API Key is missing");
    }

    const formData = new FormData();
    formData.append("file", audio, "audio.wav");
    formData.append("model", "whisper-1");
    // formData.append("language", "ko"); // Auto-detect is better for mixed usage, or 'ko' for Korean. Let's stick to auto or make it configurable later.

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`OpenAI STT Error: ${errorData.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.text;
}
