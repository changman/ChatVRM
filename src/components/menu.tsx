import { IconButton } from "./iconButton";
import { Message } from "@/features/messages/messages";
import { ChatLog } from "./chatLog";
import React, { useCallback, useContext, useRef, useState } from "react";
import { Settings } from "./settings";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { AssistantText } from "./assistantText";
import { useTranslation } from 'next-i18next';
import { LanguageSwitcher } from "./languageSwitcher";

type Props = {
  geminiApiKey: string;
  systemPrompt: string;
  chatLog: Message[];
  voiceName: string;
  chatModel: string;
  assistantMessage: string;
  onChangeSystemPrompt: (systemPrompt: string) => void;
  onChangeGeminiKey: (key: string) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeVoiceName: (voiceName: string) => void;
  onChangeChatModel: (model: string) => void;
  handleClickResetChatLog: () => void;
  handleClickResetSystemPrompt: () => void;
  handleClickClearApiKeys: () => void;
};

/**
 * 상단 메뉴 바 컴포넌트.
 * 설정 화면, 대화 로그, 언어 전환 버튼을 제공합니다.
 */
export const Menu = ({
  geminiApiKey,
  systemPrompt,
  chatLog,
  voiceName,
  chatModel,
  assistantMessage,
  onChangeSystemPrompt,
  onChangeGeminiKey,
  onChangeChatLog,
  onChangeVoiceName,
  onChangeChatModel,
  handleClickResetChatLog,
  handleClickResetSystemPrompt,
  handleClickClearApiKeys,
}: Props) => {
  const { t } = useTranslation('common');
  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const { viewer } = useContext(ViewerContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangeSystemPrompt = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChangeSystemPrompt(event.target.value);
    },
    [onChangeSystemPrompt]
  );

  const handleGeminiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeGeminiKey(event.target.value);
    },
    [onChangeGeminiKey]
  );

  const handleClickOpenVrmFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChangeVrmFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;
      const file = files[0];
      if (!file) return;

      const file_type = file.name.split(".").pop();
      if (file_type === "vrm") {
        const blob = new Blob([file], { type: "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);
        viewer.loadVrm(url);
      }

      event.target.value = "";
    },
    [viewer]
  );

  return (
    <>
      <div className="absolute z-10 m-24">
        <div className="grid grid-flow-col gap-[8px]">
          <IconButton
            iconName="24/Menu"
            label={t('menu.settings')}
            isProcessing={false}
            onClick={() => setShowSettings(true)}
          ></IconButton>
          {showChatLog ? (
            <IconButton
              iconName="24/CommentOutline"
              label={t('menu.chatLog')}
              isProcessing={false}
              onClick={() => setShowChatLog(false)}
            />
          ) : (
            <IconButton
              iconName="24/CommentFill"
              label={t('menu.chatLog')}
              isProcessing={false}
              disabled={chatLog.length <= 0}
              onClick={() => setShowChatLog(true)}
            />
          )}
          <LanguageSwitcher />
        </div>
      </div>
      {showChatLog && <ChatLog messages={chatLog} />}
      {showSettings && (
        <Settings
          geminiApiKey={geminiApiKey}
          chatLog={chatLog}
          systemPrompt={systemPrompt}
          voiceName={voiceName}
          chatModel={chatModel}
          onClickClose={() => setShowSettings(false)}
          onChangeGeminiKey={handleGeminiKeyChange}
          onChangeSystemPrompt={handleChangeSystemPrompt}
          onChangeChatLog={onChangeChatLog}
          onChangeVoiceName={onChangeVoiceName}
          onChangeChatModel={onChangeChatModel}
          onClickOpenVrmFile={handleClickOpenVrmFile}
          onClickResetChatLog={handleClickResetChatLog}
          onClickResetSystemPrompt={handleClickResetSystemPrompt}
          onClickClearApiKeys={handleClickClearApiKeys}
        />
      )}
      {!showChatLog && assistantMessage && (
        <AssistantText message={assistantMessage} />
      )}
      <input
        type="file"
        className="hidden"
        accept=".vrm"
        ref={fileInputRef}
        onChange={handleChangeVrmFile}
      />
    </>
  );
};
