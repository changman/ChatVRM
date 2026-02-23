import { LipSyncAnalyzeResult } from "./lipSyncAnalyzeResult";

const TIME_DOMAIN_DATA_LENGTH = 2048;

/**
 * raw PCM(16-bit signed int, little-endian) 데이터에 WAV 헤더를 붙여
 * Web Audio API의 decodeAudioData()가 인식할 수 있는 포맷으로 변환합니다.
 * @param pcmBuffer - WAV 헤더 없는 raw PCM ArrayBuffer
 * @param sampleRate - 샘플레이트 (Gemini Native Audio 출력: 24000Hz)
 * @param numChannels - 채널 수 (모노: 1)
 */
function pcmToWav(
  pcmBuffer: ArrayBuffer,
  sampleRate: number = 24000,
  numChannels: number = 1
): ArrayBuffer {
  const pcmData = new Uint8Array(pcmBuffer);
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const wavHeaderSize = 44;
  const wavBuffer = new ArrayBuffer(wavHeaderSize + pcmData.byteLength);
  const view = new DataView(wavBuffer);

  // WAV 헤더 작성 (RIFF 포맷)
  const writeStr = (offset: number, str: string): void => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + pcmData.byteLength, true);  // 전체 파일 크기 - 8
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);                        // fmt 청크 크기
  view.setUint16(20, 1, true);                         // PCM 포맷
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, pcmData.byteLength, true);

  // PCM 데이터 복사
  new Uint8Array(wavBuffer).set(pcmData, wavHeaderSize);
  return wavBuffer;
}

export class LipSync {
  public readonly audio: AudioContext;
  public readonly analyser: AnalyserNode;
  public readonly timeDomainData: Float32Array;

  public constructor(audio: AudioContext) {
    this.audio = audio;

    this.analyser = audio.createAnalyser();
    this.timeDomainData = new Float32Array(TIME_DOMAIN_DATA_LENGTH);
  }

  public update(): LipSyncAnalyzeResult {
    this.analyser.getFloatTimeDomainData(this.timeDomainData as any);

    let volume = 0.0;
    for (let i = 0; i < TIME_DOMAIN_DATA_LENGTH; i++) {
      volume = Math.max(volume, Math.abs(this.timeDomainData[i]));
    }

    // cook
    volume = 1 / (1 + Math.exp(-45 * volume + 5));
    if (volume < 0.1) volume = 0;

    return {
      volume,
    };
  }

  /**
   * ArrayBuffer(raw PCM 또는 WAV)를 오디오로 재생하고 립싱크 분석을 수행합니다.
   * Gemini Native Audio에서 수신한 raw PCM(24kHz, 16-bit)의 경우 WAV 헤더를 자동으로 추가합니다.
   * @param buffer - 재생할 오디오 데이터 (raw PCM 또는 WAV)
   * @param onEnded - 재생 완료 시 호출되는 콜백
   * @param isRawPcm - true이면 WAV 헤더를 붙여서 디코딩 (기본값: true)
   * @param sampleRate - PCM 샘플레이트 (기본값: 24000 / Gemini 출력 기준)
   */
  public async playFromArrayBuffer(
    buffer: ArrayBuffer,
    onEnded?: () => void,
    isRawPcm: boolean = true,
    sampleRate: number = 24000
  ): Promise<void> {
    try {
      // AudioContext가 suspended 상태이면 재개 (브라우저 AutoPlay 정책 대응)
      if (this.audio.state === "suspended") {
        await this.audio.resume();
      }

      // raw PCM이면 WAV 헤더를 붙여서 디코딩
      const decodableBuffer = isRawPcm ? pcmToWav(buffer, sampleRate) : buffer;
      const audioBuffer = await this.audio.decodeAudioData(decodableBuffer);

      const bufferSource = this.audio.createBufferSource();
      bufferSource.buffer = audioBuffer;

      bufferSource.connect(this.audio.destination);
      bufferSource.connect(this.analyser);
      bufferSource.start();
      if (onEnded) {
        bufferSource.addEventListener("ended", onEnded);
      }
    } catch (error) {
      console.error("[LipSync] 오디오 디코딩/재생 실패:", error);
      // 재생 실패 시에도 onEnded를 호출하여 다음 큐가 멈추지 않도록 함
      onEnded?.();
    }
  }

  public async playFromURL(url: string, onEnded?: () => void): Promise<void> {
    try {
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      // URL로 가져온 데이터는 이미 인코딩된 오디오 (WAV/MP3 등)
      await this.playFromArrayBuffer(buffer, onEnded, false);
    } catch (error) {
      console.error("[LipSync] URL 오디오 로드 실패:", error);
      onEnded?.();
    }
  }
}
