import { useState, useCallback } from "react";
import { Link } from "./link";
import { useTranslation } from 'next-i18next';

type Props = {
  openAiKey: string;
  elevenLabsKey: string;
  onChangeAiKey: (openAiKey: string) => void;
  onChangeElevenLabsKey: (elevenLabsKey: string) => void;
};
export const Introduction = ({
  openAiKey,
  elevenLabsKey,
  onChangeAiKey,
  onChangeElevenLabsKey,
}: Props) => {
  const { t } = useTranslation('common');
  const [opened, setOpened] = useState(true);

  const handleAiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeAiKey(event.target.value);
    },
    [onChangeAiKey]
  );

  const handleElevenLabsKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeElevenLabsKey(event.target.value);
    },
    [onChangeElevenLabsKey]
  );

  return opened ? (
    <div className="absolute z-40 w-full h-full px-24 py-40  bg-black/30 font-M_PLUS_2">
      <div className="mx-auto my-auto max-w-3xl max-h-full p-24 overflow-auto bg-white rounded-16">
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary ">
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
              url={
                "https://openai.com/blog/introducing-chatgpt-and-whisper-apis"
              }
              label={"ChatGPT API"}
            />
            {t('intro.techDescription3')}
            <Link url={"https://elevenlabs.io/"} label={"ElevenLabs"} />
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
            {t('intro.elevenLabsKeyTitle')}
          </div>
          <input
            type="text"
            placeholder="sk-..."
            value={elevenLabsKey}
            onChange={handleElevenLabsKeyChange}
            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
          ></input>
          <div>
            {t('intro.elevenLabsKeyDescription')}
            <Link
              url="https://elevenlabs.io/speech-synthesis"
              label={t('intro.elevenLabsKeyLink')}
            />
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            {t('intro.openAiKeyTitle')}
          </div>
          <input
            type="text"
            placeholder="sk-..."
            value={openAiKey}
            onChange={handleAiKeyChange}
            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
          ></input>
          <div>
            {t('intro.openAiKeyDescription')}
            <Link
              url="https://platform.openai.com/account/api-keys"
              label={t('intro.openAiKeySite')}
            />
            {t('intro.openAiKeyDescription2')}
          </div>
          <div className="my-16">
            {t('intro.openAiKeyNote')}
            <br />
            {t('intro.openAiKeyModel')}
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
