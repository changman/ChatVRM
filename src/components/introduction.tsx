import { useState, useCallback, useEffect } from "react";
import { Link } from "./link";
import { useTranslation } from 'next-i18next';

type Props = {
  geminiApiKey: string;
  onChangeGeminiKey: (geminiApiKey: string) => void;
};

/**
 * 초기 실행 시 Gemini API 키 입력을 안내하는 팝업 컴포넌트.
 * localStorage에 키가 저장되어 있으면 팝업을 건너뜁니다.
 */
export const Introduction = ({
  geminiApiKey,
  onChangeGeminiKey,
}: Props) => {
  const { t } = useTranslation('common');

  /**
   * SSR hydration mismatch 방지를 위해 초기값은 false로 설정.
   * 클라이언트에서 마운트 후 localStorage 확인합니다.
   */
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKeys = window.localStorage.getItem("chatVRMApiKeys");
      if (storedKeys) {
        try {
          const { geminiApiKey: storedKey } = JSON.parse(storedKeys);
          if (!storedKey || storedKey.trim() === "") {
            setOpened(true);
          }
        } catch {
          setOpened(true);
        }
      } else {
        setOpened(true);
      }
    }
  }, []);

  const handleGeminiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeGeminiKey(event.target.value);
    },
    [onChangeGeminiKey]
  );

  return opened ? (
    <div className="absolute z-40 w-full h-full px-24 py-40 bg-black/30 font-M_PLUS_2">
      <div className="mx-auto my-auto max-w-3xl max-h-full p-24 overflow-auto bg-white rounded-16">
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            {t('intro.title')}
          </div>
          <div>
            {t('intro.description')}
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            {t('intro.techTitle')}
          </div>
          <div>
            {t('intro.techDescription')}
            <Link
              url={"https://github.com/pixiv/three-vrm"}
              label={"@pixiv/three-vrm"}
            />
            {t('intro.techDescription2')}
            <Link
              url={"https://ai.google.dev/gemini-api/docs/live"}
              label={"Gemini Live API"}
            />
            {t('intro.techDescription4')}
          </div>
          <div className="my-16">
            {t('intro.githubDescription')}
            <br />
            {t('intro.repository')}
            <Link
              url={"https://github.com/pixiv/ChatVRM"}
              label={"https://github.com/pixiv/ChatVRM"}
            />
          </div>
        </div>

        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            {t('intro.usageTitle')}
          </div>
          <div>
            {t('intro.usageDescription')}
          </div>
        </div>

        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            {t('intro.geminiKeyTitle')}
          </div>
          <input
            type="password"
            placeholder="AIza..."
            value={geminiApiKey}
            onChange={handleGeminiKeyChange}
            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis font-mono"
          ></input>
          <div>
            {t('intro.geminiKeyDescription')}
            <Link
              url="https://aistudio.google.com/app/apikey"
              label={t('intro.geminiKeySite')}
            />
            {t('intro.geminiKeyDescription2')}
          </div>
          <div className="my-16 text-sm text-gray-500">
            {t('intro.geminiKeyNote')}
          </div>
        </div>

        <div className="my-24">
          <button
            onClick={() => {
              setOpened(false);
            }}
            className="font-bold bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white px-24 py-8 rounded-oval"
          >
            {t('intro.startButton')}
          </button>
        </div>
      </div>
    </div>
  ) : null;
};
