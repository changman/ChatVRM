import React from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";

import { Link } from "./link";

type Props = {
  openAiKey: string;
  systemPrompt: string;
  chatLog: Message[];
  voiceId: string;
  elevenLabsKey: string;
  onClickClose: () => void;
  onChangeAiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeVoiceId: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClickOpenVrmFile: () => void;
  onClickResetChatLog: () => void;
  onClickResetSystemPrompt: () => void;
  onChangeElevenLabsKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
export const Settings = ({
  openAiKey,
  chatLog,
  systemPrompt,
  voiceId,
  elevenLabsKey,
  onClickClose,
  onChangeSystemPrompt,
  onChangeAiKey,
  onChangeChatLog,
  onChangeVoiceId,
  onClickOpenVrmFile,
  onClickResetChatLog,
  onClickResetSystemPrompt,
  onChangeElevenLabsKey,
}: Props) => {
  return (
    <div className="absolute z-40 w-full h-full bg-white/80 backdrop-blur ">
      <div className="absolute m-24">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
        ></IconButton>
      </div>
      <div className="max-h-full overflow-auto">
        <div className="text-text1 max-w-3xl mx-auto px-24 py-64 ">
          <div className="my-24 typography-32 font-bold">설정</div>
          <div className="my-24">
            <div className="my-16 typography-20 font-bold">OpenAI API 키</div>
            <input
              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder="sk-..."
              value={openAiKey}
              onChange={onChangeAiKey}
            />
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
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              캐릭터 모델
            </div>
            <div className="my-8">
              <TextButton onClick={onClickOpenVrmFile}>VRM 열기</TextButton>
            </div>
          </div>
          <div className="my-40">
            <div className="my-8">
              <div className="my-16 typography-20 font-bold">
                캐릭터 설정 (시스템 프롬프트)
              </div>
              <TextButton onClick={onClickResetSystemPrompt}>
                캐릭터 설정 초기화
              </TextButton>
            </div>

            <textarea
              value={systemPrompt}
              onChange={onChangeSystemPrompt}
              className="px-16 py-8  bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
            ></textarea>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">음성 조정</div>
            <div>
              ElevenLabs API를 사용합니다. 자세한 내용은
              <Link
                url="https://elevenlabs.io/"
                label="https://elevenlabs.io/"
              />
              를 참고하세요.
            </div>
            <div className="mt-16 font-bold">API 키</div>
            <div className="mt-8">
              <input
                className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                type="text"
                placeholder="..."
                value={elevenLabsKey}
                onChange={onChangeElevenLabsKey}
              />
            </div>

            <div className="mt-16 font-bold">Voice ID</div>
            <div className="mt-8">
              <input
                className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                type="text"
                placeholder="..."
                value={voiceId}
                onChange={onChangeVoiceId}
              />
            </div>
          </div>
          {chatLog.length > 0 && (
            <div className="my-40">
              <div className="my-8 grid-cols-2">
                <div className="my-16 typography-20 font-bold">대화 내역</div>
                <TextButton onClick={onClickResetChatLog}>
                  대화 내역 초기화
                </TextButton>
              </div>
              <div className="my-8">
                {chatLog.map((value, index) => {
                  return (
                    <div
                      key={index}
                      className="my-8 grid grid-flow-col  grid-cols-[min-content_1fr] gap-x-fixed"
                    >
                      <div className="w-[64px] py-8">
                        {value.role === "assistant" ? "캐릭터" : "당신"}
                      </div>
                      <input
                        key={index}
                        className="bg-surface1 hover:bg-surface1-hover rounded-8 w-full px-16 py-8"
                        type="text"
                        value={value.content}
                        onChange={(event) => {
                          onChangeChatLog(index, event.target.value);
                        }}
                      ></input>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
