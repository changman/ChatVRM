import { useCallback, useContext, useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
  textsToScreenplay,
  Screenplay,
} from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GeminiLiveSession } from "@/features/chat/geminiLiveChat";

// MessageInputContainer는 브라우저에서만 로드되도록 dynamic import를 사용합니다.
const MessageInputContainer = dynamic(
  () => import("@/components/messageInputContainer").then((mod) => mod.MessageInputContainer),
  { ssr: false }
);

export default function Home() {
  const { viewer } = useContext(ViewerContext);
  const { t } = useTranslation('common');

  // ── 설정 상태 ──
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [voiceName, setVoiceName] = useState("Aoede");
  // Gemini Live API(bidiGenerateContent)를 지원하는 모델을 기본값으로 설정합니다.
  // 일반 텍스트 모델(gemini-2.5-flash 등)은 Live API WebSocket 연결을 지원하지 않습니다.
  // 공식 문서 참고: https://ai.google.dev/gemini-api/docs/live-guide
  const [chatModel, setChatModel] = useState("gemini-2.5-flash-native-audio-preview-12-2025");

  // ── 채팅 상태 ──
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");

  // ── Gemini Live 세션 ──
  const liveSessionRef = useRef<GeminiLiveSession | null>(null);
  const [isSessionConnected, setIsSessionConnected] = useState(false);
  const pendingTextRef = useRef<string>("");

  // ── localStorage 파라미터 로드 ──
  useEffect(() => {
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      setSystemPrompt(params.systemPrompt ?? SYSTEM_PROMPT);
      setVoiceName(params.voiceName ?? "Aoede");

      // 최신 Live API 전용 모델명을 기본값으로 설정
      // 공식 문서 참고: https://ai.google.dev/gemini-api/docs/live-guide
      const RECOMMENDED_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";
      const savedModel = params.chatModel ?? RECOMMENDED_MODEL;

      // Live API (bidiGenerateContent WebSocket) 지원 여부 확인:
      // 유효한 모델 패턴:
      //   - 'native-audio'가 포함되어야 함 (예: gemini-2.5-flash-native-audio-preview-12-2025)
      //   - 예외: gemini-2.0-flash-exp 는 bidi 지원
      // 무효한 모델 패턴:
      //   - 'gemini-live-*' 형태의 구형 모델명 (API v1beta 미지원)
      //   - gemini-2.5-flash, gemini-2.0-flash 등 일반 텍스트 모델
      const isOldLiveFormat = savedModel.startsWith("gemini-live-");
      const isValidLiveModel =
        !isOldLiveFormat &&
        (savedModel.includes("native-audio") || savedModel === "gemini-2.0-flash-exp");

      if (!isValidLiveModel) {
        console.warn(
          `[Home] Live API 미지원 또는 구형 모델(${savedModel})을 감지하여 권장 모델로 자동 교정합니다: ${RECOMMENDED_MODEL}`
        );
        setChatModel(RECOMMENDED_MODEL);
      } else {
        setChatModel(savedModel);
      }

      setChatLog(params.chatLog ?? []);
    }
  }, []);

  // ── localStorage API 키 로드 ──
  useEffect(() => {
    if (window.localStorage.getItem("chatVRMApiKeys")) {
      const apiKeys = JSON.parse(
        window.localStorage.getItem("chatVRMApiKeys") as string
      );
      setGeminiApiKey(apiKeys.geminiApiKey ?? "");
    }
  }, []);

  // ── localStorage 파라미터 저장 ──
  useEffect(() => {
    process.nextTick(() =>
      window.localStorage.setItem(
        "chatVRMParams",
        JSON.stringify({ systemPrompt, voiceName, chatLog, chatModel })
      )
    );
  }, [systemPrompt, voiceName, chatLog, chatModel]);

  // ── localStorage API 키 저장 ──
  useEffect(() => {
    process.nextTick(() =>
      window.localStorage.setItem(
        "chatVRMApiKeys",
        JSON.stringify({ geminiApiKey })
      )
    );
  }, [geminiApiKey]);

  /**
   * Gemini Live API 세션을 시작합니다.
   * 이미 세션이 있으면 종료 후 재시작합니다.
   */
  const startLiveSession = useCallback(async () => {
    if (!geminiApiKey) {
      setAssistantMessage(t('errors.noApiKey'));
      return;
    }

    console.log(`[Home] 세션 시작 시도: 모델=${chatModel}, 보이스=${voiceName}, API키=${geminiApiKey.substring(0, 5)}***`);

    // 기존 세션 종료
    if (liveSessionRef.current) {
      liveSessionRef.current.disconnect();
      liveSessionRef.current = null;
      setIsSessionConnected(false);
    }

    const session = new GeminiLiveSession(
      {
        apiKey: geminiApiKey,
        model: chatModel,
        systemPrompt: systemPrompt,
        voiceName: voiceName,
      },
      {
        onText: (text: string) => {
          // 수신된 텍스트가 누적된 전체 텍스트인지, 아니면 추가된 청크인지 확인
          if (text.startsWith(pendingTextRef.current)) {
            // 누적된 경우: 새로운 부분(Delta)만 추출하여 UI 업데이트
            const newDelta = text.substring(pendingTextRef.current.length);
            if (newDelta) {
              setAssistantMessage((prev) => prev + newDelta);
              pendingTextRef.current = text;
            }
          } else {
            // 새로운 메시지이거나 형식이 다른 경우: 그대로 추가
            pendingTextRef.current += text;
            setAssistantMessage((prev) => prev + text);
          }
        },
        onAudio: (buffer: ArrayBuffer) => {
          // Gemini TTS 오디오 수신 → 립싱크 재생
          if (!viewer.model) return;
          const currentText = pendingTextRef.current;
          const aiTalks = textsToScreenplay([currentText || "[neutral]"], voiceName);
          speakCharacter(
            aiTalks[0] ?? { expression: "neutral", talk: { style: "talk", voiceId: voiceName, message: "" } },
            viewer,
            buffer,
            undefined, // UI 업데이트는 onText에서 처리하므로 여기서 생략
            () => {
              setChatProcessing(false);
            }
          );
        },
        onTranscript: (text: string) => {
          // 사용자 발화 인식 결과 채팅 로그에 추가
          if (text.trim()) {
            setChatLog((prev) => [
              ...prev,
              { role: "user" as const, content: text },
            ]);
            setChatProcessing(true);
            setAssistantMessage("");
          }
        },
        onTurnComplete: () => {
          // AI 응답 턴 완료 처리
          if (pendingTextRef.current) {
            const finalText = pendingTextRef.current;
            setChatLog((prev) => [
              ...prev,
              { role: "assistant" as const, content: finalText },
            ]);
            pendingTextRef.current = "";
          }
          setChatProcessing(false);
        },
        onError: (error: Error) => {
          console.error("[Home] Gemini Live 오류:", error);
          setChatProcessing(false);
          setIsSessionConnected(false);
        },
        onDisconnected: () => {
          setIsSessionConnected(false);
          setChatProcessing(false);
          console.log("[Home] Gemini Live 세션 종료됨");
        },
      }
    );

    try {
      await session.connect();
      liveSessionRef.current = session;
      setIsSessionConnected(true);
    } catch (error) {
      console.error("[Home] 세션 연결 실패:", error);
      setAssistantMessage("Gemini Live API 연결에 실패했습니다. API 키를 확인해주세요.");
    }
  }, [geminiApiKey, chatModel, systemPrompt, voiceName, viewer, t]);

  /**
   * 세션이 없으면 시작, API 키나 모델 변경 시 재시작합니다.
   */
  useEffect(() => {
    if (geminiApiKey && !isSessionConnected) {
      startLiveSession();
    }
    // 컴포넌트 언마운트 시 세션 정리
    return () => {
      liveSessionRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geminiApiKey]);

  // 모델/음성/시스템프롬프트 변경 시 세션 재시작
  useEffect(() => {
    if (geminiApiKey && isSessionConnected) {
      startLiveSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatModel, voiceName, systemPrompt]);

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text } : v;
      });
      setChatLog(newChatLog);
    },
    [chatLog]
  );

  /**
   * 텍스트 입력으로 메시지 전송 처리.
   * Gemini Live 세션이 있으면 세션을 통해, 없으면 에러 메시지를 표시합니다.
   */
  const handleSendChat = useCallback(
    async (text: string) => {
      if (!geminiApiKey) {
        setAssistantMessage(t('errors.noApiKey'));
        return;
      }
      if (!text.trim()) return;

      setChatProcessing(true);
      setChatLog((prev) => [...prev, { role: "user" as const, content: text }]);
      setAssistantMessage("");

      if (liveSessionRef.current?.connected) {
        liveSessionRef.current.sendText(text);
      } else {
        // 세션 재연결 시도
        await startLiveSession();
        if (liveSessionRef.current?.connected) {
          liveSessionRef.current.sendText(text);
        } else {
          setAssistantMessage("세션 연결에 실패했습니다. 설정에서 API 키를 확인해주세요.");
          setChatProcessing(false);
        }
      }
    },
    [geminiApiKey, startLiveSession, t]
  );

  /**
   * 저장된 API 키 삭제 처리
   */
  const handleClearApiKeys = useCallback(() => {
    if (window.confirm(t('settings.apiKeysCleared'))) {
      window.localStorage.removeItem("chatVRMApiKeys");
      setGeminiApiKey("");
      liveSessionRef.current?.disconnect();
      liveSessionRef.current = null;
      setIsSessionConnected(false);
    }
  }, [t]);

  return (
    <div className={"font-M_PLUS_2"}>
      <Meta />
      <Introduction
        geminiApiKey={geminiApiKey}
        onChangeGeminiKey={setGeminiApiKey}
      />
      <VrmViewer />
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
        geminiApiKey={geminiApiKey}
        liveSession={liveSessionRef.current}
      />
      <Menu
        geminiApiKey={geminiApiKey}
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        voiceName={voiceName}
        chatModel={chatModel}
        assistantMessage={assistantMessage}
        onChangeGeminiKey={setGeminiApiKey}
        onChangeSystemPrompt={setSystemPrompt}
        onChangeChatLog={handleChangeChatLog}
        onChangeVoiceName={setVoiceName}
        onChangeChatModel={setChatModel}
        handleClickResetChatLog={() => setChatLog([])}
        handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
        handleClickClearApiKeys={handleClearApiKeys}
      />
      <GitHubLink />
    </div>
  );
}

export async function getServerSideProps(context: any) {
  return {
    props: {
      ...(await serverSideTranslations(context.locale, ['common'])),
    },
  };
}
