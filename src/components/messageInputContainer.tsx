import { MessageInput } from "@/components/messageInput";
import { useState, useEffect, useCallback } from "react";
import { useMicVAD } from "@ricky0123/vad-react";
import { float32ArrayToWav } from "@/utils/audioWav";
import { getSpeechToText } from "@/features/chat/speechToText";

type Props = {
  isChatProcessing: boolean;
  onChatProcessStart: (text: string) => void;
  openAiKey: string;
};

/**
 * テキスト入力と音声入力を提供する
 *
 * 音声認識の完了時は自動で送信し、返答文の生成中は入力を無効化する
 *
 */
export const MessageInputContainer = ({
  isChatProcessing,
  onChatProcessStart,
  openAiKey,
}: Props) => {
  const [userMessage, setUserMessage] = useState("");
  const [isProcessingStt, setIsProcessingStt] = useState(false);

  const vad = useMicVAD({
    startOnLoad: true, // VAD 자동 로드 시작
    workletURL: "/vad.worklet.bundle.min.js",
    modelURL: "/silero_vad_legacy.onnx",
    ortConfig: (ort: any) => {
      ort.env.wasm.wasmPaths = "/";
      ort.env.wasm.numThreads = 1;
    },
    onSpeechEnd: async (audio: Float32Array) => {
      if (isProcessingStt || isChatProcessing) return;

      console.log("VAD: Speech ended, processing...");
      setIsProcessingStt(true);
      try {
        const wavBlob = float32ArrayToWav(audio, 16000);
        const text = await getSpeechToText(wavBlob, openAiKey);
        console.log("VAD: Transcribed text:", text);
        if (text && text.trim().length > 0) {
          setUserMessage(text);
          onChatProcessStart(text);
        }
      } catch (e) {
        console.error("VAD STT Error:", e);
      } finally {
        setIsProcessingStt(false);
      }
    },
    onVADMisfire: () => {
      console.log("VAD: Misfire (noise detected)");
    },
    onSpeechStart: () => {
      console.log("VAD: Speech started");
    },
  } as any);

  const handleClickMicButton = useCallback(() => {
    console.log("Mic button clicked. Current state:", {
      listening: vad.listening,
      loading: vad.loading,
      errored: vad.errored,
    });
    if (vad.listening) {
      console.log("Pausing VAD...");
      vad.pause();
    } else {
      console.log("Starting VAD...");
      vad.start();
    }
  }, [vad]);

  const handleClickSendButton = useCallback(() => {
    onChatProcessStart(userMessage);
  }, [onChatProcessStart, userMessage]);

  useEffect(() => {
    if (!isChatProcessing) {
      setUserMessage("");
    }
  }, [isChatProcessing]);

  // VAD 상태에 따라 마이크 아이콘 상태 결정
  // vad.userSpeaking: 사용자가 말하는 중
  // vad.loading: VAD 모델 로딩 중
  // vad.errored: 에러 발생

  const isMicRecording = vad.listening;

  return (
    <MessageInput
      userMessage={userMessage}
      isChatProcessing={isChatProcessing || isProcessingStt} // STT 처리 중에도 입력 막음
      isMicRecording={vad.listening && !vad.loading}
      disabled={isChatProcessing || isProcessingStt || vad.loading}
      onChangeUserMessage={(e) => setUserMessage(e.target.value)}
      onClickMicButton={handleClickMicButton}
      onClickSendButton={handleClickSendButton}
    />
  );
};
