import { useState, useCallback } from "react";
import { Link } from "./link";

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
            이 애플리케이션에 대해
          </div>
          <div>
            웹 브라우저만으로 3D 캐릭터와 대화를 즐길 수 있습니다. 마이크나 텍스트 입력, 음성 합성을 사용하여 캐릭터와 소통하고, 캐릭터(VRM) 변경, 성격 설정, 음성 조정도 할 수 있습니다.
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            기술 소개
          </div>
          <div>
            3D 모델 표시 및 조작은
            <Link
              url={"https://github.com/pixiv/three-vrm"}
              label={"@pixiv/three-vrm"}
            />
            , 대화문 생성은
            <Link
              url={
                "https://openai.com/blog/introducing-chatgpt-and-whisper-apis"
              }
              label={"ChatGPT API"}
            />
            , 음성 합성은
            <Link url={"https://elevenlabs.io/"} label={"ElevenLabs"} />
            를 사용합니다.
          </div>
          <div className="my-16">
            이 데모는 GitHub에 소스 코드를 공개하고 있습니다. 자유롭게 수정하거나 개선해 보세요!
            <br />
            리포지토리：
            <Link
              url={"https://github.com/pixiv/ChatVRM"}
              label={"https://github.com/pixiv/ChatVRM"}
            />
          </div>
        </div>

        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            이용 시 주의사항
          </div>
          <div>
            차별적이거나 폭력적인 발언, 특정인을 비하하는 발언을 의도적으로 유도하지 마세요. 또한 VRM 모델을 사용하여 캐릭터를 변경할 때는 모델의 이용 조건을 준수해 주세요.
          </div>
        </div>

        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            ElevenLabs API Key
          </div>
          <input
            type="text"
            placeholder="sk-..."
            value={elevenLabsKey}
            onChange={handleElevenLabsKeyChange}
            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
          ></input>
          <div>
            API 키는 ElevenLabs 사이트에서 발급받으세요.
            <Link
              url="https://elevenlabs.io/speech-synthesis"
              label="자세히 보기"
            />
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            OpenAI API 키
          </div>
          <input
            type="text"
            placeholder="sk-..."
            value={openAiKey}
            onChange={handleAiKeyChange}
            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
          ></input>
          <div>
            API 키는
            <Link
              url="https://platform.openai.com/account/api-keys"
              label="OpenAI 사이트"
            />
            에서 발급받을 수 있습니다. 발급받은 API 키를 입력란에 입력해 주세요.
          </div>
          <div className="my-16">
            ChatGPT API는 브라우저에서 직접 접근합니다. API 키와 대화 내용은 픽시브 서버에 저장되지 않습니다.
            <br />
            ※사용 중인 모델은 ChatGPT API (GPT-3.5)입니다.
          </div>
        </div>
        <div className="my-24">
          <button
            onClick={() => {
              setOpened(false);
            }}
            className="font-bold bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white px-24 py-8 rounded-oval"
          >
            API 키를 입력하고 시작하기
          </button>
        </div>
      </div>
    </div>
  ) : null;
};
