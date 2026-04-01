/**
 * 오디오 처리 유틸리티 모듈.
 * 마이크 캡처, Float32Array와 PCM Int16 간 변환 기능을 제공합니다.
 */
import { DebugFlags } from "./debugFlags";

/**
 * Float32Array 오디오 데이터를 16-bit signed integer PCM ArrayBuffer로 변환합니다.
 * Gemini Live API의 audio/pcm;rate=16000 형식에 맞게 변환합니다.
 *
 * @param float32Array - Web Audio API에서 반환되는 Float32 형식 오디오 데이터
 * @returns Int16 PCM 형식의 ArrayBuffer
 */
export function float32ToPcm16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
        // -1.0 ~ 1.0 범위를 -32768 ~ 32767 범위로 클리핑 후 변환
        const clamped = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    }
    return buffer;
}

/**
 * 마이크 오디오 스트림을 캡처하여 콜백으로 PCM 데이터를 전달하는 관리 클래스.
 * ScriptProcessorNode를 사용하여 실시간으로 오디오 청크를 Gemini Live API로 전송합니다.
 */
export class MicrophoneCapture {
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private processorNode: ScriptProcessorNode | null = null;
    private onAudioChunk: (pcm: ArrayBuffer) => void;
    private targetSampleRate: number;

    public constructor(
        onAudioChunk: (pcm: ArrayBuffer) => void,
        targetSampleRate: number = 16000
    ) {
        this.onAudioChunk = onAudioChunk;
        this.targetSampleRate = targetSampleRate;
    }

    /**
     * 마이크 캡처를 시작합니다.
     * 브라우저 마이크 권한 요청 후 AudioContext를 통해 PCM 스트리밍을 시작합니다.
     */
    public async start(): Promise<void> {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: this.targetSampleRate,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            this.audioContext = new AudioContext({ sampleRate: this.targetSampleRate });
            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

            // ScriptProcessorNode로 오디오 청크 캡처 (8192 샘플 = ~512ms 단위)
            // 4096(256ms)은 음절 단위로 전송되어 partial transcript가 잦음
            this.processorNode = this.audioContext.createScriptProcessor(8192, 1, 1);
            this.processorNode.onaudioprocess = (event) => {
                const inputData = event.inputBuffer.getChannelData(0);
                const pcm = float32ToPcm16(inputData);
                if (DebugFlags.timingLog) console.log(`[⏱️ 1-MIC-SEND] t=${performance.now().toFixed(0)}ms size=${pcm.byteLength}bytes`);
                this.onAudioChunk(pcm);
            };

            this.sourceNode.connect(this.processorNode);
            this.processorNode.connect(this.audioContext.destination);
        } catch (error) {
            console.error("[MicrophoneCapture] 마이크 시작 오류:", error);
            throw error;
        }
    }

    /**
     * 마이크 캡처를 중지하고 모든 리소스를 해제합니다.
     */
    public stop(): void {
        try {
            if (this.processorNode) {
                this.processorNode.disconnect();
                this.processorNode = null;
            }
            if (this.sourceNode) {
                this.sourceNode.disconnect();
                this.sourceNode = null;
            }
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach((track) => track.stop());
                this.mediaStream = null;
            }
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
        } catch (error) {
            console.error("[MicrophoneCapture] 마이크 중지 오류:", error);
        }
    }

    /** 현재 마이크 캡처가 활성 상태인지 반환합니다. */
    public get isActive(): boolean {
        return this.mediaStream !== null;
    }
}
