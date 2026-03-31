import { GoogleGenAI, LiveServerMessage, MediaResolution, Modality, Session } from "@google/genai";

/**
 * Gemini Live API 세션 이벤트 콜백 인터페이스.
 * 텍스트 응답, 오디오 응답, 전사 텍스트, 오류, 세션 종료를 처리합니다.
 */
export interface GeminiLiveCallbacks {
    /** AI 텍스트 응답 청크 수신 시 호출 */
    onText?: (text: string) => void;
    /** AI 오디오 응답 청크 수신 시 호출 (PCM ArrayBuffer) */
    onAudio?: (buffer: ArrayBuffer) => void;
    /** 사용자 발화 인식 텍스트 수신 시 호출 */
    onTranscript?: (text: string) => void;
    /** AI 응답 턴 완료 시 호출 */
    onTurnComplete?: () => void;
    /** 오류 발생 시 호출 */
    onError?: (error: Error) => void;
    /** 세션 연결 종료 시 호출 */
    onDisconnected?: () => void;
}

/**
 * Gemini Live API 세션 설정 인터페이스.
 */
export interface GeminiLiveConfig {
    apiKey: string;
    model?: string;
    systemPrompt?: string;
    /** API 버전 (기본값: "v1beta") */
    apiVersion?: string;
    /** TTS 응답 보이스 이름 (예: "Aoede", "Charon", "Fenrir", "Kore", "Puck") */
    voiceName?: string;
}

/**
 * Gemini Live API와의 실시간 WebSocket 세션을 관리하는 클래스.
 * 단일 세션 내에서 VAD(음성 활동 감지), STT(음성→텍스트),
 * LLM(대화 생성), TTS(텍스트→음성)를 통합 처리합니다.
 */
export class GeminiLiveSession {
    /** 스트리밍 메시지 로그 활성화 여부 (기본값: 비활성) */
    public static debugLog: boolean = false;

    private session: Session | null = null;
    private client: GoogleGenAI;
    private config: GeminiLiveConfig;
    private callbacks: GeminiLiveCallbacks;
    private isConnected: boolean = false;

    public constructor(config: GeminiLiveConfig, callbacks: GeminiLiveCallbacks) {
        this.config = config;
        this.callbacks = callbacks;
        this.client = new GoogleGenAI({
            apiKey: config.apiKey,
            httpOptions: {
                apiVersion: config.apiVersion ?? "v1beta"
            }
        });
    }

    /**
     * 모델 이름으로 Gemini Live API(bidiGenerateContent) 지원 여부를 판별합니다.
     * SDK가 supportedGenerationMethods를 노출하지 않으므로 이름 패턴으로 식별합니다.
     */
    public static isLiveModel(name: string): boolean {
        return (
            name.includes("native-audio") ||
            name.includes("-live-") ||
            name.endsWith("-live") ||
            name === "gemini-2.0-flash-exp"
        );
    }

    /**
     * Gemini Live API(bidiGenerateContent WebSocket)를 지원하는 모델 목록을 서버에서 가져옵니다.
     * API 키만으로 호출 가능한 static 메서드입니다.
     * @param apiKey - Gemini API 키
     * @returns bidiGenerateContent를 지원하는 모델 이름 목록
     */
    public static async getLiveModels(apiKey: string): Promise<string[]> {
        const client = new GoogleGenAI({
            apiKey,
            httpOptions: { apiVersion: "v1beta" },
        });
        const pager = await client.models.list();
        const liveModels: string[] = [];
        for await (const model of pager) {
            if (!model.name) continue;
            const name = model.name.replace("models/", "");
            if (GeminiLiveSession.isLiveModel(name)) {
                liveModels.push(name);
            }
        }
        return liveModels;
    }

    /**
     * Gemini Live API 세션을 시작합니다.
     * 연결 후 오디오 응답 수신을 위한 이벤트 핸들러를 등록합니다.
     */
    public async connect(): Promise<void> {
        try {
            const modelName = this.config.model ?? "gemini-2.5-flash-native-audio-preview-12-2025";
            if (GeminiLiveSession.debugLog) console.log(`[GeminiLive] 세션 연결 시도 중... (모델: ${modelName})`);

            this.session = await this.client.live.connect({
                model: modelName,
                config: {
                    // 공식 문서: 한 세션에 TEXT와 AUDIO 동시 설정 불가 → config error 발생
                    // 참고: https://ai.google.dev/gemini-api/docs/live-guide#response-modalities
                    responseModalities: [Modality.AUDIO],
                    mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
                    // 오디오 출력에 대한 텍스트 전사 활성화 (AI 응답 텍스트를 텍스트로도 수신)
                    outputAudioTranscription: {},
                    // 사용자 입력 오디오에 대한 텍스트 전사 활성화
                    inputAudioTranscription: {},
                    systemInstruction: this.config.systemPrompt
                        ? { parts: [{ text: this.config.systemPrompt }] }
                        : undefined,
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: this.config.voiceName ?? "Aoede",
                            },
                        },
                    },
                },
                callbacks: {
                    onopen: () => {
                        this.isConnected = true;
                        if (GeminiLiveSession.debugLog) console.log("[GeminiLive] WebSocket 연결 성공");
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (GeminiLiveSession.debugLog) {
                            console.log("[GeminiLive] 메시지 수신:", JSON.stringify(message, null, 2));
                        }
                        this.handleMessage(message);
                    },
                    onerror: (err: ErrorEvent) => {
                        console.error("[GeminiLive] WebSocket 오류 발생:", err);
                        this.callbacks.onError?.(new Error(err.message || "WebSocket connection error"));
                    },
                    onclose: (evt: CloseEvent) => {
                        this.isConnected = false;
                        console.warn(`[GeminiLive] WebSocket 연결 종료 (코드: ${evt.code}, 사유: ${evt.reason})`);
                        this.callbacks.onDisconnected?.();
                    },
                },
            });
        } catch (error: any) {
            console.error("[GeminiLive] 세션 연결 실패 상세:", error);
            if (error.message) {
                console.error("[GeminiLive] 오류 메시지:", error.message);
            }
            throw error;
        }
    }

    /**
     * Gemini Native Audio 모델의 thinking(내부 추론) 텍스트를 필터링합니다.
     * thinking 텍스트는 실제 AI 응답이 아닌 모델의 내부 사고 과정이므로 표시하지 않습니다.
     * @param text - 필터링할 텍스트
     * @returns thinking 부분을 제거한 텍스트, 순수 thinking이면 빈 문자열("")
     */
    private filterThinkingText(text: string): string {
        // 1. 블록형 thinking (<thinking>...</thinking>)
        const thinkingBlockPattern = /<thinking>[\s\S]*?<\/thinking>/gi;

        // 2. 제목형 thinking 및 이어지는 설명 (**제목** 설명...)
        // **로 시작하는 헤더와 그 뒤에 이어지는 영어/설명 텍스트들을 한글이 나오기 전까지 최대한 제거
        const thinkingHeaderPattern = /^\*\*([^*]+)\*\*([\s\S]*?)(?=[가-힣ㄱ-ㅎㅏ-ㅣ]|$)/;

        let filtered = text.replace(thinkingBlockPattern, "").trim();

        // 헤더 패턴 매칭 및 제거
        if (thinkingHeaderPattern.test(filtered)) {
            filtered = filtered.replace(thinkingHeaderPattern, "").trim();
        }

        // 만약 여전히 ** 로 시작하는 줄이 있다면 (멀티라인 thinking)
        if (filtered.startsWith("**")) {
            const lines = filtered.split("\n");
            const realLines = lines.filter(line => !line.trim().startsWith("**"));
            filtered = realLines.join("\n").trim();
        }

        return filtered;
    }

    /**
     * Gemini Live API로부터 수신한 메시지를 처리합니다.
     * 텍스트, 오디오, 전사 텍스트, 턴 완료 이벤트를 분기 처리합니다.
     */
    private handleMessage(message: LiveServerMessage): void {
        try {
            // 서버발 컨텐츠 처리
            const serverContent = message.serverContent;
            let currentText = "";

            if (serverContent?.modelTurn) {
                const parts = serverContent.modelTurn.parts;
                if (parts) {
                    for (const part of parts) {
                        // 모델이 직접 보내는 텍스트 파트 (Thinking 등)
                        if (part.text) {
                            const filtered = this.filterThinkingText(part.text);
                            if (filtered) {
                                if (GeminiLiveSession.debugLog) console.log("[GeminiLive] modelTurn 텍스트:", filtered);
                                currentText = filtered;
                            }
                        }
                        // 오디오 응답 (inlineData: Base64 raw PCM)
                        if (part.inlineData?.data) {
                            if (GeminiLiveSession.debugLog) console.log(`[GeminiLive] 오디오 데이터 수신 (${part.inlineData.data.length} chars base64)`);
                            const buffer = this.base64ToArrayBuffer(part.inlineData.data);
                            this.callbacks.onAudio?.(buffer);
                        }
                    }
                }
            }

            // AI 오디오 응답의 텍스트 전사 (더 고품질의 실시간 텍스트 소스)
            const outputTranscript = serverContent?.outputTranscription?.text;
            if (outputTranscript) {
                const filtered = this.filterThinkingText(outputTranscript);
                if (filtered) {
                    if (GeminiLiveSession.debugLog) console.log("[GeminiLive] outputTranscription 텍스트:", filtered);
                    currentText = filtered; // outputTranscription을 우선시함
                }
            }

            // 최종 필터링된 텍스트가 있으면 콜백 호출
            if (currentText) {
                this.callbacks.onText?.(currentText);
            }

            // 사용자 입력 오디오의 텍스트 전사 (inputAudioTranscription 활성화 시 수신)
            const inputTranscript = serverContent?.inputTranscription?.text;
            if (inputTranscript) {
                if (GeminiLiveSession.debugLog) console.log("[GeminiLive] 사용자 발화 인식(STT):", inputTranscript);
                this.callbacks.onTranscript?.(inputTranscript);
            }

            // 턴 완료
            if (serverContent?.turnComplete) {
                if (GeminiLiveSession.debugLog) console.log("[GeminiLive] 응답 턴 완료 (turnComplete)");
                this.callbacks.onTurnComplete?.();
            }

            // 인터럽트 발생 시 (사용자가 말을 가로챘을 때)
            if (message.serverContent?.interrupted) {
                if (GeminiLiveSession.debugLog) console.log("[GeminiLive] AI 응답 인터럽트 발생");
            }

            // 셋업 완료
            if (message.setupComplete) {
                if (GeminiLiveSession.debugLog) console.log("[GeminiLive] 세션 설정 완료 (setupComplete)");
            }
        } catch (error) {
            console.error("[GeminiLive] 메시지 처리 중 예외 발생:", error);
        }
    }

    /**
     * PCM 오디오 데이터를 Gemini Live API 세션으로 전송합니다.
     * @param pcmData - 16kHz, 16-bit signed integer PCM 데이터
     */
    public sendAudio(pcmData: ArrayBuffer): void {
        if (!this.session || !this.isConnected) {
            console.warn("[GeminiLive] 세션이 연결되지 않아 오디오 전송 불가");
            return;
        }
        try {
            const base64 = this.arrayBufferToBase64(pcmData);
            this.session.sendRealtimeInput({
                audio: {
                    data: base64,
                    mimeType: "audio/pcm;rate=16000",
                },
            });
        } catch (error) {
            console.error("[GeminiLive] 오디오 전송 오류:", error);
        }
    }

    /**
     * 비디오 프레임(JPEG/PNG base64)을 Gemini Live API 세션으로 전송합니다.
     * @param base64 - Base64 인코딩된 이미지 데이터
     * @param mimeType - 이미지 MIME 타입 (예: "image/jpeg")
     */
    public sendVideo(base64: string, mimeType: string): void {
        if (!this.session || !this.isConnected) {
            return;
        }
        try {
            this.session.sendRealtimeInput({
                video: {
                    data: base64,
                    mimeType,
                },
            });
        } catch (error) {
            console.error("[GeminiLive] 비디오 프레임 전송 오류:", error);
        }
    }

    /**
     * 텍스트 메시지를 Gemini Live API 세션으로 전송합니다.
     * @param text - 사용자 메시지 텍스트
     */
    public sendText(text: string): void {
        if (!this.session || !this.isConnected) {
            console.warn("[GeminiLive] 세션이 연결되지 않아 텍스트 전송 불가");
            return;
        }
        try {
            // 공식 문서 JavaScript 예제 기준: turns에 문자열 직접 전달 가능
            // 참고: https://ai.google.dev/gemini-api/docs/live-guide#sending-text
            this.session.sendClientContent({
                turns: text,
                turnComplete: true,
            });
        } catch (error) {
            console.error("[GeminiLive] 텍스트 전송 오류:", error);
        }
    }

    /**
     * Gemini Live API 세션 연결을 종료합니다.
     */
    public disconnect(): void {
        try {
            if (this.session) {
                this.session.close();
                this.session = null;
            }
            this.isConnected = false;
        } catch (error) {
            console.error("[GeminiLive] 세션 종료 오류:", error);
        }
    }

    /** 현재 세션 연결 여부를 반환합니다. */
    public get connected(): boolean {
        return this.isConnected;
    }

    /**
     * ArrayBuffer를 Base64 문자열로 변환합니다.
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Base64 문자열을 ArrayBuffer로 변환합니다.
     */
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const buffer = new ArrayBuffer(binary.length);
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return buffer;
    }
}
