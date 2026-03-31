import { IconButton } from "./iconButton";
import { useTranslation } from 'next-i18next';

type Props = {
  userMessage: string;
  isMicRecording: boolean;
  isCameraActive: boolean;
  isChatProcessing: boolean;
  onChangeUserMessage: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onClickSendButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onClickMicButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onClickCameraButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};
export const MessageInput = ({
  userMessage,
  isMicRecording,
  isCameraActive,
  isChatProcessing,
  onChangeUserMessage,
  onClickMicButton,
  onClickCameraButton,
  onClickSendButton,
  disabled,
}: Props) => {
  const { t } = useTranslation('common');
  return (
    <div className="absolute bottom-0 z-20 w-screen">
      <div className="bg-base text-black">
        <div className="mx-auto max-w-4xl p-16">
          <div className="grid grid-flow-col gap-[8px] grid-cols-[min-content_min-content_1fr_min-content]">
            <IconButton
              iconName="24/Microphone"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
              isProcessing={isMicRecording}
              disabled={isChatProcessing || disabled}
              onClick={onClickMicButton}
            />
            <IconButton
              iconName="24/CameraVideo"
              className={isCameraActive
                ? "bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:bg-secondary-disabled"
                : "bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"}
              isProcessing={false}
              disabled={isChatProcessing || disabled}
              onClick={onClickCameraButton}
            />
            <input
              type="text"
              placeholder={t('messageInput.placeholder')}
              onChange={onChangeUserMessage}
              disabled={isChatProcessing}
              className="bg-surface1 hover:bg-surface1-hover focus:bg-surface1 disabled:bg-surface1-disabled disabled:text-primary-disabled rounded-16 w-full px-16 text-text-primary typography-16 font-bold disabled"
              value={userMessage}
            ></input>

            <IconButton
              iconName="24/Send"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
              isProcessing={isChatProcessing}
              disabled={isChatProcessing || !userMessage}
              onClick={onClickSendButton}
            />
          </div>
        </div>
        <div className="py-4 bg-[#413D43] text-center text-white font-Montserrat">
          powered by VRoid, ElevenLabs, ChatGPT API
        </div>
      </div>
    </div>
  );
};
