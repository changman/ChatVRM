import { useEffect, useRef } from "react";
import { FaceBox } from "@/utils/faceDetectorService";

type Props = {
  /** 카메라 활성 여부 */
  isActive: boolean;
  /** 표시할 MediaStream (CameraCapture.mediaStream) */
  mediaStream: MediaStream | null;
  /** MediaPipe 얼굴 감지 결과 (0.0~1.0 정규화 좌표) */
  faceBoxes?: FaceBox[];
};

/**
 * PiP(Picture-in-Picture) 카메라 프리뷰 컴포넌트.
 * 화면 우하단에 플로팅으로 표시되며, isActive가 false이면 렌더링하지 않습니다.
 */
export const CameraPiP = ({ isActive, mediaStream, faceBoxes }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  if (!isActive) return null;

  return (
    <div className="absolute bottom-[88px] right-[24px] z-30">
      <div className="relative rounded-12 overflow-hidden border-2 border-white/60 shadow-xl w-[160px] h-[120px] bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
        {/* 얼굴 감지 바운딩 박스 오버레이 — video와 동일하게 scaleX(-1) 반전 적용 */}
        {faceBoxes && faceBoxes.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: "scaleX(-1)" }}
          >
            {faceBoxes.map((face, i) => (
              <rect
                key={i}
                x={`${face.x * 100}%`}
                y={`${face.y * 100}%`}
                width={`${face.width * 100}%`}
                height={`${face.height * 100}%`}
                fill="none"
                stroke="#00ff88"
                strokeWidth="2"
                rx="3"
              />
            ))}
          </svg>
        )}
        {/* 녹화 중 표시 */}
        <div className="absolute top-6 left-6 flex items-center gap-4">
          <span className="block w-8 h-8 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-[10px] font-bold drop-shadow">LIVE</span>
        </div>
      </div>
    </div>
  );
};
