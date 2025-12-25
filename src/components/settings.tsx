import React from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";

import { Link } from "./link";
import { useTranslation } from 'next-i18next';

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
  const { t } = useTranslation('common');
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
          <div className="my-24 typography-32 font-bold">{t('settings.title')}</div>
          <div className="my-24">
            <div className="my-16 typography-20 font-bold">{t('settings.openAiKeyTitle')}</div>
            <input
              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder="sk-..."
              value={openAiKey}
              onChange={onChangeAiKey}
            />
            <div>
              {t('settings.openAiKeyDescription')}
              <Link
                url="https://platform.openai.com/account/api-keys"
                label={t('settings.openAiKeySite')}
              />
              {t('settings.openAiKeyDescription2')}
            </div>
          </div>
          <div className="my-16">
            {t('settings.openAiKeyNote')}
            <br />
            {t('settings.openAiKeyModel')}
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              {t('settings.characterModelTitle')}
            </div>
            <div className="my-8">
              <TextButton onClick={onClickOpenVrmFile}>{t('settings.openVrmButton')}</TextButton>
            </div>
          </div>
          <div className="my-40">
            <div className="my-8">
              <div className="my-16 typography-20 font-bold">
                {t('settings.systemPromptTitle')}
              </div>
              <TextButton onClick={onClickResetSystemPrompt}>
                {t('settings.resetSystemPromptButton')}
              </TextButton>
            </div>

            <textarea
              value={systemPrompt}
              onChange={onChangeSystemPrompt}
              className="px-16 py-8  bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
            ></textarea>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">{t('settings.voiceTitle')}</div>
            <div>
              {t('settings.voiceDescription')}
              <Link
                url="https://elevenlabs.io/"
                label="https://elevenlabs.io/"
              />
              {t('settings.voiceDescription2')}
            </div>
            <div className="mt-16 font-bold">{t('settings.apiKeyLabel')}</div>
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
                <div className="my-16 typography-20 font-bold">{t('settings.chatHistoryTitle')}</div>
                <TextButton onClick={onClickResetChatLog}>
                  {t('settings.resetChatHistoryButton')}
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
                        {value.role === "assistant" ? t('settings.roleCharacter') : t('settings.roleYou')}
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
