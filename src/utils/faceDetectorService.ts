import { FaceDetector, FilesetResolver, Detection } from "@mediapipe/tasks-vision";

/**
 * 얼굴 감지 결과의 바운딩 박스 (0.0~1.0 정규화 좌표).
 */
export interface FaceBox {
    /** 좌측 상단 X (0.0~1.0) */
    x: number;
    /** 좌측 상단 Y (0.0~1.0) */
    y: number;
    /** 너비 비율 (0.0~1.0) */
    width: number;
    /** 높이 비율 (0.0~1.0) */
    height: number;
    /** 감지 신뢰도 (0.0~1.0) */
    confidence: number;
}

/**
 * MediaPipe FaceDetector를 이용한 실시간 얼굴 감지 서비스.
 * 카메라 MediaStream을 받아 requestAnimationFrame 루프로 얼굴 좌표를 추출합니다.
 * Gemini Live 세션과 독립적으로 동작하며 대화 흐름에 영향을 주지 않습니다.
 */
export class FaceDetectorService {
    private detector: FaceDetector | null = null;
    private videoEl: HTMLVideoElement | null = null;
    private rafId: number | null = null;
    private lastTimestamp: number = -1;
    private lastCallTime: number = 0;
    private onFace: (faces: FaceBox[]) => void;
    /** 감지 호출 최소 간격 (ms). 기본 100ms = 최대 10fps */
    private readonly throttleMs: number;

    public constructor(onFace: (faces: FaceBox[]) => void, throttleMs = 100) {
        this.onFace = onFace;
        this.throttleMs = throttleMs;
    }

    /**
     * MediaPipe WASM 런타임과 BlazeFace 모델을 로드합니다.
     * 앱 시작 시 한 번만 호출하면 되며, 이후 start()를 반복 호출할 수 있습니다.
     */
    public async init(): Promise<void> {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        this.detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
                delegate: "GPU",
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5,
        });
    }

    /**
     * 주어진 MediaStream으로 얼굴 감지 루프를 시작합니다.
     * init()이 먼저 호출되어야 합니다.
     */
    public start(stream: MediaStream): void {
        if (!this.detector) {
            console.warn("[FaceDetector] init()을 먼저 호출하세요.");
            return;
        }
        this.videoEl = document.createElement("video");
        this.videoEl.srcObject = stream;
        this.videoEl.autoplay = true;
        this.videoEl.muted = true;
        this.videoEl.playsInline = true;
        this.videoEl.play().then(() => {
            this.lastTimestamp = -1;
            this.loop();
        }).catch((err) => {
            console.error("[FaceDetector] 비디오 재생 오류:", err);
        });
    }

    private loop(): void {
        if (!this.detector || !this.videoEl) return;

        const now = performance.now();
        if (now - this.lastCallTime >= this.throttleMs) {
            // VIDEO 모드: timestamp는 반드시 단조 증가해야 함
            if (now > this.lastTimestamp) {
                this.lastTimestamp = now;
                try {
                    const result = this.detector.detectForVideo(this.videoEl, now);
                    const boxes = this.toNormalized(result.detections);
                    this.onFace(boxes);
                } catch (e) {
                    // 비디오가 아직 준비되지 않은 경우 무시
                }
                this.lastCallTime = now;
            }
        }

        this.rafId = requestAnimationFrame(() => this.loop());
    }

    private toNormalized(detections: Detection[]): FaceBox[] {
        if (!this.videoEl) return [];
        const { videoWidth: w, videoHeight: h } = this.videoEl;
        if (!w || !h) return [];

        return detections.map((d) => ({
            x: Math.max(0, (d.boundingBox?.originX ?? 0) / w),
            y: Math.max(0, (d.boundingBox?.originY ?? 0) / h),
            width: Math.min(1, (d.boundingBox?.width ?? 0) / w),
            height: Math.min(1, (d.boundingBox?.height ?? 0) / h),
            confidence: d.categories?.[0]?.score ?? 0,
        }));
    }

    /**
     * 얼굴 감지 루프를 중지하고 모든 리소스를 해제합니다.
     */
    public stop(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.videoEl) {
            this.videoEl.srcObject = null;
            this.videoEl = null;
        }
        this.lastTimestamp = -1;
        this.lastCallTime = 0;
    }

    /**
     * 서비스 전체를 종료합니다. 이후 재사용하려면 init()부터 다시 호출해야 합니다.
     */
    public dispose(): void {
        this.stop();
        this.detector?.close();
        this.detector = null;
    }

    /** 현재 감지 루프가 실행 중인지 반환합니다. */
    public get isRunning(): boolean {
        return this.rafId !== null;
    }
}
