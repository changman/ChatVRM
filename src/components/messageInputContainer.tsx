import { MessageInput } from "@/components/messageInput";
import { CameraPiP } from "@/components/cameraPiP";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { GeminiLiveSession } from "@/features/chat/geminiLiveChat";
import { MicrophoneCapture } from "@/utils/audioUtils";
import { CameraCapture } from "@/utils/videoUtils";
import { FaceBox, FaceDetectorService } from "@/utils/faceDetectorService";

type Props = {
  isChatProcessing: boolean;
  onChatProcessStart: (text: string) => void;
  geminiApiKey?: string;
  liveSessionRef?: React.MutableRefObject<GeminiLiveSession | null>;
  isSpeakingRef?: React.MutableRefObject<boolean>;
  onCameraToggle?: (active: boolean) => void;
};

/**
 * 텍스트 입력과 음성 입력을 제공하는 입력 컨테이너 컴포넌트.
 * Gemini Live API 세션을 통해 실시간 마이크 스트리밍을 처리합니다.
 * 음성 인식(VAD/STT)은 Gemini Live API 내장 기능을 사용합니다.
 * 얼굴 감지는 MediaPipe FaceDetector가 독립적으로 처리합니다.
 */
export const MessageInputContainer = ({
  isChatProcessing,
  onChatProcessStart,
  liveSessionRef,
  isSpeakingRef,
  onCameraToggle,
}: Props) => {
  const [userMessage, setUserMessage] = useState("");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [faceBoxes, setFaceBoxes] = useState<FaceBox[]>([]);
  const micCaptureRef = useRef<MicrophoneCapture | null>(null);
  const cameraCaptureRef = useRef<CameraCapture | null>(null);
  const faceDetectorRef = useRef<FaceDetectorService | null>(null);

  /**
   * 마이크 버튼 클릭 시 마이크 캡처를 시작/중지합니다.
   * Gemini Live API 세션이 연결된 경우 오디오를 실시간으로 전송합니다.
   */
  const handleClickMicButton = useCallback(async () => {
    if (isMicActive) {
      micCaptureRef.current?.stop();
      micCaptureRef.current = null;
      setIsMicActive(false);
      return;
    }

    try {
      const capture = new MicrophoneCapture((pcm: ArrayBuffer) => {
        // AI 재생 중에는 마이크 전송 차단 (echo → VAD 오탐 방지)
        if (isSpeakingRef?.current) return;
        const session = liveSessionRef?.current;
        if (session?.connected) {
          session.sendAudio(pcm);
        }
      });
      await capture.start();
      micCaptureRef.current = capture;
      setIsMicActive(true);
    } catch (error) {
      console.error("[MessageInputContainer] 마이크 시작 실패:", error);
    }
  }, [isMicActive, liveSessionRef]);

  /**
   * 카메라 버튼 클릭 시 카메라 캡처를 시작/중지합니다.
   * 활성화 시 1fps 프레임을 Gemini Live 세션으로 전송하고,
   * MediaPipe FaceDetector를 병렬로 시작하여 실시간 얼굴 감지를 수행합니다.
   */
  const handleClickCameraButton = useCallback(async () => {
    if (isCameraActive) {
      // 카메라 중지
      cameraCaptureRef.current?.stop();
      cameraCaptureRef.current = null;
      // 얼굴 감지 중지
      faceDetectorRef.current?.stop();
      setCameraStream(null);
      setFaceBoxes([]);
      setIsCameraActive(false);
      onCameraToggle?.(false);
      return;
    }

    try {
      // 카메라 시작 — 1fps 프레임을 Gemini로 전송
      const capture = new CameraCapture((base64: string, mimeType: string) => {
        const session = liveSessionRef?.current;
        if (session?.connected) {
          session.sendVideo(base64, mimeType);
        }
      });
      const stream = await capture.start();
      cameraCaptureRef.current = capture;
      setCameraStream(stream);
      setIsCameraActive(true);
      onCameraToggle?.(true);

      // MediaPipe 얼굴 감지 시작 — 같은 MediaStream 재사용 (카메라 재오픈 없음)
      if (!faceDetectorRef.current) {
        faceDetectorRef.current = new FaceDetectorService(
          (faces: FaceBox[]) => setFaceBoxes(faces),
          100 // 100ms throttle = 최대 10fps
        );
        await faceDetectorRef.current.init();
      }
      faceDetectorRef.current.start(stream);
    } catch (error) {
      console.error("[MessageInputContainer] 카메라 시작 실패:", error);
    }
  }, [isCameraActive, liveSessionRef, onCameraToggle]);

  /**
   * 텍스트 전송 버튼 클릭 시 처리합니다.
   */
  const handleClickSendButton = useCallback(() => {
    if (!userMessage.trim()) return;
    onChatProcessStart(userMessage);
  }, [onChatProcessStart, userMessage]);

  // 채팅 처리 완료 시 입력 초기화
  useEffect(() => {
    if (!isChatProcessing) {
      setUserMessage("");
    }
  }, [isChatProcessing]);

  // 컴포넌트 언마운트 시 마이크/카메라/얼굴 감지 정리
  useEffect(() => {
    return () => {
      micCaptureRef.current?.stop();
      cameraCaptureRef.current?.stop();
      faceDetectorRef.current?.dispose();
    };
  }, []);

  return (
    <>
      <CameraPiP isActive={isCameraActive} mediaStream={cameraStream} faceBoxes={faceBoxes} />
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
