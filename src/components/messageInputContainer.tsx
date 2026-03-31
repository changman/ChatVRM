import { MessageInput } from "@/components/messageInput";
import { CameraPiP } from "@/components/cameraPiP";
import { useState, useEffect, useCallback, useRef } from "react";
import { GeminiLiveSession } from "@/features/chat/geminiLiveChat";
import { MicrophoneCapture } from "@/utils/audioUtils";
import { CameraCapture } from "@/utils/videoUtils";

type Props = {
  isChatProcessing: boolean;
  onChatProcessStart: (text: string) => void;
  geminiApiKey: string;
  onAudioReceived?: (buffer: ArrayBuffer) => void;
  onTranscript?: (text: string) => void;
  liveSession?: GeminiLiveSession | null;
};

/**
 * 텍스트 입력과 음성 입력을 제공하는 입력 컨테이너 컴포넌트.
 * Gemini Live API 세션을 통해 실시간 마이크 스트리밍을 처리합니다.
 * 음성 인식(VAD/STT)은 Gemini Live API 내장 기능을 사용합니다.
 */
export const MessageInputContainer = ({
  isChatProcessing,
  onChatProcessStart,
  geminiApiKey,
  onAudioReceived,
  onTranscript,
  liveSession,
}: Props) => {
  const [userMessage, setUserMessage] = useState("");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const micCaptureRef = useRef<MicrophoneCapture | null>(null);
  const cameraCaptureRef = useRef<CameraCapture | null>(null);

  /**
   * 마이크 버튼 클릭 시 마이크 캡처를 시작/중지합니다.
   * Gemini Live API 세션이 연결된 경우 오디오를 실시간으로 전송합니다.
   */
  const handleClickMicButton = useCallback(async () => {
    if (isMicActive) {
      // 마이크 중지
      micCaptureRef.current?.stop();
      micCaptureRef.current = null;
      setIsMicActive(false);
      return;
    }

    // 마이크 시작
    try {
      const capture = new MicrophoneCapture((pcm: ArrayBuffer) => {
        if (liveSession?.connected) {
          liveSession.sendAudio(pcm);
        }
      });
      await capture.start();
      micCaptureRef.current = capture;
      setIsMicActive(true);
    } catch (error) {
      console.error("[MessageInputContainer] 마이크 시작 실패:", error);
    }
  }, [isMicActive, liveSession]);

  /**
   * 카메라 버튼 클릭 시 카메라 캡처를 시작/중지합니다.
   * 활성화 시 1fps 프레임을 Gemini Live 세션으로 전송합니다.
   */
  const handleClickCameraButton = useCallback(async () => {
    if (isCameraActive) {
      cameraCaptureRef.current?.stop();
      cameraCaptureRef.current = null;
      setCameraStream(null);
      setIsCameraActive(false);
      return;
    }

    try {
      const capture = new CameraCapture((base64: string, mimeType: string) => {
        if (liveSession?.connected) {
          liveSession.sendVideo(base64, mimeType);
        }
      });
      const stream = await capture.start();
      cameraCaptureRef.current = capture;
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (error) {
      console.error("[MessageInputContainer] 카메라 시작 실패:", error);
    }
  }, [isCameraActive, liveSession]);

  /**
   * 텍스트 전송 버튼 클릭 시 처리합니다.
   * Gemini Live API 세션이 있으면 세션을 통해, 없으면 상위 핸들러로 전송합니다.
   */
  const handleClickSendButton = useCallback(() => {
    if (!userMessage.trim()) return;
    // index.tsx의 handleSendChat에서 세션 체크 및 전송을 통합 처리하도록 변경
    onChatProcessStart(userMessage);
  }, [onChatProcessStart, userMessage]);

  // 채팅 처리 완료 시 입력 초기화
  useEffect(() => {
    if (!isChatProcessing) {
      setUserMessage("");
    }
  }, [isChatProcessing]);

  // 컴포넌트 언마운트 시 마이크/카메라 정리
  useEffect(() => {
    return () => {
      micCaptureRef.current?.stop();
      cameraCaptureRef.current?.stop();
    };
  }, []);

  return (
    <>
      <CameraPiP isActive={isCameraActive} mediaStream={cameraStream} />
      <MessageInput
        userMessage={userMessage}
        isChatProcessing={isChatProcessing}
        isMicRecording={isMicActive}
        isCameraActive={isCameraActive}
        disabled={isChatProcessing}
        onChangeUserMessage={(e) => setUserMessage(e.target.value)}
        onClickMicButton={handleClickMicButton}
        onClickCameraButton={handleClickCameraButton}
        onClickSendButton={handleClickSendButton}
      />
    </>
  );
};
