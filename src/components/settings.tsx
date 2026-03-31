import React, { useState, useEffect } from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";
import { Link } from "./link";
import { useTranslation } from 'next-i18next';
import { SettingsCard } from "./settingsCard";
import { GeminiLiveSession } from "@/features/chat/geminiLiveChat";

/**
 * Gemini TTS 보이스 옵션 목록
 */
const GEMINI_VOICES = [
  { id: "Aoede", label: "Aoede (기본)" },
  { id: "Charon", label: "Charon" },
  { id: "Fenrir", label: "Fenrir" },
  { id: "Kore", label: "Kore" },
  { id: "Puck", label: "Puck" },
];

/** API 키가 없거나 로드 실패 시 사용할 폴백 모델 목록 */
const FALLBACK_MODELS = [
  "gemini-2.5-flash-native-audio-preview-12-2025",
  "gemini-2.0-flash-exp",
];

type Props = {
  geminiApiKey: string;
  systemPrompt: string;
  chatLog: Message[];
  voiceName: string;
  chatModel: string;
  onClickClose: () => void;
  onChangeGeminiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeVoiceName: (voiceName: string) => void;
  onChangeChatModel: (model: string) => void;
  onClickOpenVrmFile: () => void;
  onClickResetChatLog: () => void;
  onClickResetSystemPrompt: () => void;
  onClickClearApiKeys: () => void;
};

/**
 * 설정 화면 컴포넌트.
 * General(Gemini API 키, 모델), Character(VRM, 시스템 프롬프트), Voice(TTS 보이스) 탭을 제공합니다.
 */
export const Settings = ({
  geminiApiKey,
  chatLog,
  systemPrompt,
  voiceName,
  chatModel,
  onClickClose,
  onChangeSystemPrompt,
  onChangeGeminiKey,
  onChangeChatLog,
  onChangeVoiceName,
  onChangeChatModel,
  onClickOpenVrmFile,
  onClickResetChatLog,
  onClickResetSystemPrompt,
  onClickClearApiKeys,
}: Props) => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'general' | 'character' | 'voice'>('general');
  const [liveModels, setLiveModels] = useState<string[]>(FALLBACK_MODELS);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [debugLog, setDebugLog] = useState(GeminiLiveSession.debugLog);

  // API 키가 있으면 서버에서 Live 지원 모델 목록을 가져옵니다.
  useEffect(() => {
    if (!geminiApiKey) {
      setLiveModels(FALLBACK_MODELS);
      return;
    }
    setModelsLoading(true);
    GeminiLiveSession.getLiveModels(geminiApiKey)
      .then((models) => {
        setLiveModels(models.length > 0 ? models : FALLBACK_MODELS);
      })
      .catch(() => {
        setLiveModels(FALLBACK_MODELS);
      })
      .finally(() => setModelsLoading(false));
  }, [geminiApiKey]);

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'character', label: 'Character' },
    { id: 'voice', label: 'Voice' },
  ] as const;

  return (
    <div className={"absolute z-40 w-full h-full bg-white/90 backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-300"}>

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
                {/* Gemini API Key Card */}
                <SettingsCard title={t('settings.geminiKeyTitle')} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80">
                  <div>
                    <div className="mb-8 text-sm text-gray-600">
                      {t('settings.geminiKeyDescription')}
                      <Link
                        url="https://aistudio.google.com/app/apikey"
                        label={t('settings.geminiKeySite')}
                      />
                      {t('settings.geminiKeyDescription2')}
                    </div>
                    <input
                      className="w-full px-16 py-12 bg-gray-50 border border-gray-200 rounded-16 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      type="password"
                      placeholder="AIza..."
                      value={geminiApiKey}
                      onChange={onChangeGeminiKey}
                    />
                  </div>

                  <div className="bg-orange-50/50 border border-orange-100 p-16 rounded-16 text-orange-800 text-sm flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{t('settings.apiKeyStorageWarning')}</div>
                      <div className="opacity-80 mb-4 text-xs">{t('settings.geminiKeyNote')}</div>
                      <TextButton onClick={onClickClearApiKeys} className="text-orange-600 hover:text-orange-700 underline">
                        {t('settings.clearApiKeysButton')}
                      </TextButton>
                    </div>
                  </div>
                </SettingsCard>

                {/* Model Settings Card */}
                <SettingsCard title={t('settings.lmmTitle')} description={t('settings.lmmDescription')} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80">
                  <div className="flex flex-col gap-16">
                    <div className="flex flex-col gap-8">
                      <label className="font-bold text-sm text-gray-700">Gemini Model</label>
                      <div className="relative">
                        <select
                          className="w-full px-16 py-12 bg-gray-50 border border-gray-200 rounded-16 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer disabled:opacity-50"
                          value={chatModel}
                          disabled={modelsLoading}
                          onChange={(e) => onChangeChatModel(e.target.value)}
                        >
                          {liveModels.map((id) => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                          {modelsLoading ? "⟳" : "▼"}
                        </div>
                      </div>
                      {modelsLoading && (
                        <div className="text-xs text-primary animate-pulse">서버에서 모델 목록을 불러오는 중...</div>
                      )}
                      <div className="text-gray-400 text-xs">
                        {t('settings.noteUsingModel')}
                      </div>
                    </div>

                    {/* 디버그 로그 토글 */}
                    <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                      <div>
                        <div className="font-bold text-sm text-gray-700">스트리밍 디버그 로그</div>
                        <div className="text-xs text-gray-400 mt-2">활성화 시 브라우저 콘솔에 수신 메시지를 출력합니다. 실시간 대화 성능에 영향을 줄 수 있습니다.</div>
                      </div>
                      <button
                        onClick={() => {
                          const next = !debugLog;
                          GeminiLiveSession.debugLog = next;
                          setDebugLog(next);
                        }}
                        style={{
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          width: '44px',
                          height: '24px',
                          borderRadius: '9999px',
                          backgroundColor: debugLog ? '#6366f1' : '#d1d5db',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{
                          display: 'inline-block',
                          width: '18px',
                          height: '18px',
                          borderRadius: '9999px',
                          backgroundColor: 'white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          transform: debugLog ? 'translateX(22px)' : 'translateX(3px)',
                          transition: 'transform 0.2s',
                        }} />
                      </button>
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
                <SettingsCard title={t('settings.systemPromptTitle')} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80 mt-40">
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
                    </div>

                    <div className="flex flex-col gap-8">
                      <label className="font-bold text-gray-700">Voice</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                        {GEMINI_VOICES.map((voice) => (
                          <button
                            key={voice.id}
                            onClick={() => onChangeVoiceName(voice.id)}
                            className={`px-16 py-12 rounded-16 border-2 text-sm font-medium transition-all ${voiceName === voice.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-primary/50'
                              }`}
                          >
                            {voice.label}
                          </button>
                        ))}
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
