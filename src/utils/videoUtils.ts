/**
 * 카메라 비디오 캡처 유틸리티 모듈.
 * 카메라 스트림을 캡처하여 1fps로 JPEG 프레임을 Gemini Live API로 전송합니다.
 * media_resolution: "low" 설정에 맞게 256x256 해상도로 리사이즈합니다.
 */

/** low 해상도 프레임 크기 (Gemini media_resolution: low 권장) */
const FRAME_SIZE = 256;

/** JPEG 캡처 품질 (0.0~1.0). NEXT_PUBLIC_CAMERA_FRAME_QUALITY 환경변수로 조정 가능 */
const FRAME_QUALITY = (() => {
    const val = parseFloat(process.env.NEXT_PUBLIC_CAMERA_FRAME_QUALITY ?? "0.8");
    return isNaN(val) ? 0.8 : Math.max(0, Math.min(1, val));
})();

/**
 * 카메라 스트림을 캡처하여 1fps 프레임 콜백을 제공하는 관리 클래스.
 * mediaStream을 직접 노출하여 PiP 프리뷰에서 재사용할 수 있습니다.
 */
export class CameraCapture {
    private _mediaStream: MediaStream | null = null;
    private videoEl: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private onFrame: (base64: string, mimeType: string) => void;

    public constructor(onFrame: (base64: string, mimeType: string) => void) {
        this.onFrame = onFrame;
    }

    /**
     * 카메라를 시작합니다.
     * 브라우저 카메라 권한 요청 후 1fps 프레임 캡처를 시작합니다.
     * @returns 활성화된 MediaStream (PiP 프리뷰에 사용)
     */
    public async start(): Promise<MediaStream> {
        this._mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
        });

        // 내부 비디오 엘리먼트 (프레임 캡처 전용, DOM에 추가하지 않음)
        this.videoEl = document.createElement("video");
        this.videoEl.srcObject = this._mediaStream;
        this.videoEl.autoplay = true;
        this.videoEl.muted = true;
        this.videoEl.playsInline = true;
        await this.videoEl.play();

        this.canvas = document.createElement("canvas");
        this.canvas.width = FRAME_SIZE;
        this.canvas.height = FRAME_SIZE;

        // 1fps 프레임 전송
        this.intervalId = setInterval(() => this.captureFrame(), 1000);

        return this._mediaStream;
    }

    private captureFrame(): void {
        if (!this.videoEl || !this.canvas) return;
        const ctx = this.canvas.getContext("2d");
        if (!ctx) return;

        // 비디오를 정사각형으로 크롭하여 256x256으로 리사이즈
        const { videoWidth, videoHeight } = this.videoEl;
        const side = Math.min(videoWidth, videoHeight);
        const sx = (videoWidth - side) / 2;
        const sy = (videoHeight - side) / 2;

        ctx.drawImage(this.videoEl, sx, sy, side, side, 0, 0, FRAME_SIZE, FRAME_SIZE);

        const dataUrl = this.canvas.toDataURL("image/jpeg", FRAME_QUALITY);
        const base64 = dataUrl.split(",")[1];
        if (base64) {
            this.onFrame(base64, "image/jpeg");
        }
    }

    /**
     * 카메라 캡처를 중지하고 모든 리소스를 해제합니다.
     */
    public stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.videoEl) {
            this.videoEl.srcObject = null;
            this.videoEl = null;
        }
        if (this._mediaStream) {
            this._mediaStream.getTracks().forEach((t) => t.stop());
            this._mediaStream = null;
        }
        this.canvas = null;
    }

    /** 현재 활성 MediaStream (PiP 프리뷰용) */
    public get mediaStream(): MediaStream | null {
        return this._mediaStream;
    }

    /** 카메라 캡처가 활성 상태인지 반환합니다. */
    public get isActive(): boolean {
        return this._mediaStream !== null;
    }
}
