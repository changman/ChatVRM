import React, { useState } from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";
import { Link } from "./link";
import { useTranslation } from 'next-i18next';
import { SettingsCard } from "./settingsCard";

type Props = {
  openAiKey: string;
  systemPrompt: string;
  chatLog: Message[];
  voiceId: string;
  elevenLabsKey: string;
  chatModel: string;
  onClickClose: () => void;
  onChangeAiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeVoiceId: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeChatModel: (model: string) => void;
  onClickOpenVrmFile: () => void;
  onClickResetChatLog: () => void;
  onClickResetSystemPrompt: () => void;
  onChangeElevenLabsKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClickClearApiKeys: () => void;
};

export const Settings = ({
  openAiKey,
  chatLog,
  systemPrompt,
  voiceId,
  elevenLabsKey,
  chatModel,
  onClickClose,
  onChangeSystemPrompt,
  onChangeAiKey,
  onChangeChatLog,
  onChangeVoiceId,
  onChangeChatModel,
  onClickOpenVrmFile,
  onClickResetChatLog,
  onClickResetSystemPrompt,
  onChangeElevenLabsKey,
  onClickClearApiKeys,
}: Props) => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'general' | 'character' | 'voice'>('general');

  // Tab definitions
  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'character', label: 'Character' },
    { id: 'voice', label: 'Voice' },
  ] as const;

  return (
    <div className="absolute z-40 w-full h-full bg-white/90 backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-300">

      {/* Header Section */}
      <div className="flex items-center justify-between px-24 py-16 border-b border-white/20 bg-white/40 shadow-sm z-50">
        <div className="typography-24 font-bold text-gray-800 flex items-center gap-2">
          <span className="bg-primary/10 p-2 rounded-lg text-primary">⚙️</span>
          {t('settings.title')}
        </div>
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
          className="hover:bg-red-50 hover:text-red-500 transition-colors"
        />
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">

        {/* Tab Navigation */}
        <div className="px-24 pt-24 pb-8 flex justify-center">
          <div className="flex p-4 bg-gray-100/80 backdrop-blur-sm rounded-full gap-2 shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-24 py-8 rounded-full text-sm font-bold transition-all duration-200 transform ${activeTab === tab.id
                  ? 'bg-primary text-white shadow-md scale-105'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
              >
                {tab.id === 'general' && "General"}
                {tab.id === 'character' && "Persona"}
                {tab.id === 'voice' && "Voice"}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-24 pb-40 scrollTop">
          <div className="max-w-3xl mx-auto py-24">

            {/* ---------------- GENERAL TAB ---------------- */}
            {activeTab === 'general' && (
              <div className="flex flex-col" style={{ gap: '40px' }}>
                {/* OpenAI API Key Card */}
                <SettingsCard title={t('settings.openAiKeyTitle')} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80">

                  <div>
                    <div className="mb-8 text-sm text-gray-600">
                      {t('settings.openAiKeyDescription')}
                      <Link
                        url="https://platform.openai.com/account/api-keys"
                        label={t('settings.openAiKeySite')}
                      />
                      {t('settings.openAiKeyDescription2')}
                    </div>
                    <input
                      className="w-full px-16 py-12 bg-gray-50 border border-gray-200 rounded-16 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      type="text"
                      placeholder="sk-..."
                      value={openAiKey}
                      onChange={onChangeAiKey}
                    />
                  </div>

                  <div className="bg-orange-50/50 border border-orange-100 p-16 rounded-16 text-orange-800 text-sm flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{t('settings.apiKeyStorageWarning')}</div>
                      <div className="opacity-80 mb-4 text-xs">This key is stored locally in your browser.</div>
                      <TextButton onClick={onClickClearApiKeys} className="text-orange-600 hover:text-orange-700 underline">
                        {t('settings.clearApiKeysButton')}
                      </TextButton>
                    </div>
                  </div>

                </SettingsCard>

                {/* LMM / Model Settings Card */}
                <SettingsCard title={t('settings.lmmTitle')} description={t('settings.lmmDescription')} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80">
                  <div className="flex flex-col gap-16">
                    <div className="flex flex-col gap-8">
                      <label className="font-bold text-sm text-gray-700">Chat Model</label>
                      <div className="relative">
                        <select
                          className="w-full px-16 py-12 bg-gray-50 border border-gray-200 rounded-16 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer"
                          value={chatModel}
                          onChange={(e) => onChangeChatModel(e.target.value)}
                        >
                          <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                          <option value="gpt-4">gpt-4</option>
                          <option value="gpt-4-turbo">gpt-4-turbo</option>
                          <option value="gpt-4o">gpt-4o</option>
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                          ▼
                        </div>
                      </div>
                      <div className="text-gray-400 text-xs">
                        {t('settings.noteUsingGpt4')}
                      </div>
                    </div>
                  </div>
                </SettingsCard>
              </div>
            )}

            {/* ---------------- CHARACTER TAB ---------------- */}
            {activeTab === 'character' && (
              <>
                {/* Character Model Card */}
                <SettingsCard title={t('settings.characterModelTitle')} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80">
                  <div className="flex flex-col gap-24 items-start">
                    <div className="p-4 bg-gray-50 rounded-lg w-full mb-4 text-sm text-gray-600">
                      Import your own VRM model to change the avatar.
                    </div>
                    <TextButton onClick={onClickOpenVrmFile} className="bg-primary text-white px-24 py-12 rounded-full hover:bg-primary-hover transition-colors shadow-md">
                      {t('settings.openVrmButton')}
                    </TextButton>
                  </div>
                </SettingsCard>

                {/* System Prompt Card */}
                <SettingsCard title={t('settings.systemPromptTitle')} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80">
                  <div className="flex flex-col gap-24">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Customize how the character behaves.</span>
                      <TextButton onClick={onClickResetSystemPrompt} className="text-gray-500 hover:text-red-500 text-sm">
                        {t('settings.resetSystemPromptButton')}
                      </TextButton>
                    </div>
                    <textarea
                      value={systemPrompt}
                      onChange={onChangeSystemPrompt}
                      className="w-full h-168 px-16 py-12 bg-gray-50 border border-gray-200 rounded-16 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-mono text-sm leading-relaxed transition-all"
                      placeholder="You are a helpful assistant..."
                    ></textarea>
                  </div>
                </SettingsCard>
              </>
            )}

            {/* ---------------- VOICE TAB ---------------- */}
            {activeTab === 'voice' && (
              <>
                {/* Voice Settings Card */}
                <SettingsCard title={t('settings.voiceTitle')} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80">
                  <div className="flex flex-col gap-16">
                    <div className="text-sm text-gray-600">
                      {t('settings.voiceDescription')}
                      <Link
                        url="https://elevenlabs.io/"
                        label="https://elevenlabs.io/"
                      />
                      {t('settings.voiceDescription2')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="flex flex-col gap-8">
                        <div className="font-bold text-gray-700">{t('settings.apiKeyLabel')}</div>
                        <input
                          className="w-full px-16 py-12 bg-gray-50 border border-gray-200 rounded-16 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                          type="password"
                          placeholder="Experiment with different voices..."
                          value={elevenLabsKey}
                          onChange={onChangeElevenLabsKey}
                        />
                      </div>

                      <div className="flex flex-col gap-8">
                        <div className="font-bold text-gray-700">Voice ID</div>
                        <input
                          className="w-full px-16 py-12 bg-gray-50 border border-gray-200 rounded-16 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                          type="text"
                          placeholder="21m00Tcm4TlvDq8ikWAM"
                          value={voiceId}
                          onChange={onChangeVoiceId}
                        />
                      </div>
                    </div>
                  </div>
                </SettingsCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
