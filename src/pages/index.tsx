import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { DebugFlags } from "@/utils/debugFlags";
import dynamic from 'next/dynamic';
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
  textsToScreenplay,
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
  const isCameraActiveRef = useRef(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting" | "reconnecting" | "error">("disconnected");
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTextRef = useRef<string>("");
  const pendingUserTranscriptRef = useRef<boolean>(false);
  const transcriptDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);
  const sessionResumptionHandleRef = useRef<string | undefined>(undefined);

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

      if (!GeminiLiveSession.isLiveModel(savedModel)) {
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
   * 지수 백오프 기반의 자동 재연결 기능을 포함합니다.
   */
  const startLiveSession = useCallback(async (isAutoReconnect = false) => {
    // ── 진단: 호출 경로 및 시점 추적 ──
    console.log(`[Home][진단] startLiveSession 호출 (isAutoReconnect=${isAutoReconnect}, 기존세션=${!!liveSessionRef.current})`);
    console.trace("[Home][진단] 호출 스택");

    if (!geminiApiKey) {
      setAssistantMessage(t('errors.noApiKey'));
      setConnectionStatus("disconnected");
      return;
    }

    if (isAutoReconnect) {
      setConnectionStatus("reconnecting");
      console.log(`[Home] 자동 재연결 시도 중... (횟수: ${reconnectCountRef.current})`);
    } else {
      setConnectionStatus("connecting");
      reconnectCountRef.current = 0; // 수동 시작 시 횟수 초기화
    }

    // 기존 타이머 및 세션 정리
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (liveSessionRef.current) {
      liveSessionRef.current.disconnect();
      liveSessionRef.current = null;
    }

    const session = new GeminiLiveSession(
      {
        apiKey: geminiApiKey,
        model: chatModel,
        systemPrompt: systemPrompt,
        voiceName: voiceName,
        enableVideo: isCameraActiveRef.current,
        resumptionHandle: sessionResumptionHandleRef.current,
      },
      {
        onText: (text: string) => {
          setConnectionStatus("connected");
          // 수신된 텍스트가 누적된 전체 텍스트인지, 아니면 추가된 청크인지 확인
          if (text.startsWith(pendingTextRef.current)) {
            const newDelta = text.substring(pendingTextRef.current.length);
            if (newDelta) {
              setAssistantMessage((prev) => prev + newDelta);
              pendingTextRef.current = text;
            }
          } else {
            pendingTextRef.current += text;
            setAssistantMessage((prev) => prev + text);
          }
        },
        onAudio: (buffer: ArrayBuffer) => {
          if (!viewer.model) return;
          if (DebugFlags.timingLog) console.log(`[⏱️ 4b-AUDIO-CB] t=${performance.now().toFixed(0)}ms → speakCharacter 큐 진입`);
          // AI 재생 중 마이크 전송 차단 (echo → VAD 오탐 방지)
          isSpeakingRef.current = true;
          const currentText = pendingTextRef.current;
          const aiTalks = textsToScreenplay([currentText || "[neutral]"], voiceName);
          speakCharacter(
            aiTalks[0] ?? { expression: "neutral", talk: { style: "talk", voiceId: voiceName, message: "" } },
            viewer,
            buffer,
            undefined,
            () => setChatProcessing(false)
          );
        },
        onTranscript: (text: string) => {
          if (!text.trim()) return;

          // 사용자가 말하기 시작 → AI 재생 차단 해제
          isSpeakingRef.current = false;

          // UI 업데이트는 즉시 수행 (채팅로그 실시간 반영)
          setChatLog((prev) => {
            if (pendingUserTranscriptRef.current && prev.length > 0 && prev[prev.length - 1].role === "user") {
              return [...prev.slice(0, -1), { role: "user" as const, content: text }];
            }
            pendingUserTranscriptRef.current = true;
            return [...prev, { role: "user" as const, content: text }];
          });

          // setChatProcessing/setAssistantMessage는 150ms debounce
          // 음절마다 호출 시 리렌더링 폭주 방지
          if (transcriptDebounceRef.current) {
            clearTimeout(transcriptDebounceRef.current);
          }
          transcriptDebounceRef.current = setTimeout(() => {
            setChatProcessing(true);
            setAssistantMessage("");
            transcriptDebounceRef.current = null;
          }, 150);
        },
        onTurnComplete: () => {
          pendingUserTranscriptRef.current = false;
          // AI 턴 완료 → 마이크 차단 해제 (안전 리셋)
          isSpeakingRef.current = false;
          if (pendingTextRef.current) {
            setChatLog((prev) => [...prev, { role: "assistant" as const, content: pendingTextRef.current }]);
            pendingTextRef.current = "";
          }
          setChatProcessing(false);
        },
        onError: (error: Error) => {
          console.error("[Home] Gemini Live 오류:", error);
          setConnectionStatus("error");
          setChatProcessing(false);
          setIsSessionConnected(false);
          triggerAutoReconnect();
        },
        onDisconnected: () => {
          console.warn("[Home] Gemini Live 세션 연결 종료됨");
          setConnectionStatus("disconnected");
          setIsSessionConnected(false);
          setChatProcessing(false);
          triggerAutoReconnect();
        },
        onSessionResumptionUpdate: (handle: string, resumable: boolean) => {
          // resumable=true인 핸들만 저장 — 재연결 시 대화 컨텍스트 복원에 사용
          if (resumable) {
            sessionResumptionHandleRef.current = handle;
          }
        },
      }
    );

    const triggerAutoReconnect = () => {
      if (reconnectCountRef.current < 5) { // 최대 5회 재시도
        const delay = Math.pow(2, reconnectCountRef.current) * 1000; // 지수 백오프
        reconnectCountRef.current += 1;
        console.log(`[Home] ${delay}ms 후 재연결을 시도합니다...`);
        reconnectTimerRef.current = setTimeout(() => {
          startLiveSession(true);
        }, delay);
      } else {
        console.error("[Home] 최대 재연결 시도 횟수를 초과했습니다.");
        setAssistantMessage("연결이 반복적으로 끊겨 자동 재연결을 중단했습니다. 네트워크 상태를 확인해주세요.");
      }
    };

    try {
      await session.connect();
      liveSessionRef.current = session;
      setIsSessionConnected(true);
      setConnectionStatus("connected");
      reconnectCountRef.current = 0; // 연결 성공 시 초기화
    } catch (error) {
      console.error("[Home] 세션 연결 실패:", error);
      if (!isAutoReconnect) {
        setAssistantMessage("Gemini Live API 연결에 실패했습니다. API 키와 모델 설정을 확인해주세요.");
      }
      setConnectionStatus("error");
      triggerAutoReconnect();
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

  // 모델/음성/시스템프롬프트 변경 시 세션 재시작 (설정 변경이므로 이전 컨텍스트 초기화)
  useEffect(() => {
    if (geminiApiKey && isSessionConnected) {
      sessionResumptionHandleRef.current = undefined;
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
   * 카메라 ON/OFF 토글 시 호출됩니다.
   * enableVideo 설정이 바뀌므로 세션을 재시작합니다.
   */
  const handleCameraToggle = useCallback((active: boolean) => {
    isCameraActiveRef.current = active;
    startLiveSession();
  }, [startLiveSession]);

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
        liveSessionRef={liveSessionRef}
        isSpeakingRef={isSpeakingRef}
        onCameraToggle={handleCameraToggle}
      />
      <Menu
        geminiApiKey={geminiApiKey}
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        voiceName={voiceName}
        chatModel={chatModel}
        assistantMessage={
          assistantMessage ||
          (connectionStatus === "connecting" ? "Gemini Live API에 연결 중입니다..." :
            connectionStatus === "reconnecting" ? `연속 연결이 끊어져 재연결 시도 중입니다... (재시도: ${reconnectCountRef.current}/5)` :
              connectionStatus === "error" ? "연결에 오류가 발생했습니다." : "")
        }
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
