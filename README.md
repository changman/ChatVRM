# ChatVRM

ChatVRM은 기술 공유 및 데모를 주 목적으로 한 프로젝트입니다.

이 저장소는 2024-07-18 시점의 코드를 보유하고 아카이브되었습니다.
ChatVRM에 대한 변경을 원하는 경우, 포크를 수행하여 개발해 주시면 감사하겠습니다.

또한 관련 프로젝트로 [local-chat-vrm](https://github.com/pixiv/local-chat-vrm)도 공개하고 있습니다.
local-chat-vrm은 반환 문장의 생성과 읽기 음성 생성을 브라우저에서 실행할 수 있는 애플리케이션입니다. 그러나 응답은 영어로만 지원하며 일본어는 사용할 수 없습니다.

---

ChatVRM은 브라우저에서 쉽게 3D 캐릭터와 대화할 수 있는 데모 애플리케이션입니다.

VRM 파일을 가져와서 캐릭터에 맞는 목소리 조정과 감정 표현을 포함한 응답 문장 생성 등을 할 수 있습니다.

ChatVRM의 각 기능은 주로 다음 기술을 사용합니다.

- 사용자의 음성 인식
    - [Web Speech API(SpeechRecognition)](https://developer.mozilla.org/ja/docs/Web/API/SpeechRecognition)
- 응답 문장 생성
    - [ChatGPT API](https://platform.openai.com/docs/api-reference/chat)
- 읽기 음성 생성
    - [ElevenLabs API](https://elevenlabs.io/)
- 3D 캐릭터 표시
    - [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)

## 실행
로컬 환경에서 실행하려면 이 저장소를 클론하거나 다운로드해주세요.

```bash
git clone git@github.com:pixiv/ChatVRM.git
```

필요한 패키지를 설치해주세요.
```bash
npm install
```

패키지 설치가 완료된 후, 다음 명령어로 개발용 웹 서버를 시작합니다.
```bash
npm run dev
```

실행 후, 다음 URL로 접속하여 작동을 확인해 주세요.

[http://localhost:3000](http://localhost:3000) 


---

## ChatGPT API

ChatVRM은 응답 문장 생성에 ChatGPT API를 사용합니다.

ChatGPT API의 사양과 이용 규약에 대한 내용은 다음 링크와 공식 사이트를 참조해 주세요.

- [https://platform.openai.com/docs/api-reference/chat](https://platform.openai.com/docs/api-reference/chat)
- [https://openai.com/policies/api-data-usage-policies](https://openai.com/policies/api-data-usage-policies)


## ElevenLabs API
ChatVRM은 읽기 음성 생성에 ElevenLabs API를 사용합니다.

ElevenLabs API의 사양과 이용 규약에 대한 내용은 다음 링크와 공식 사이트를 참조해 주세요.

- [https://elevenlabs.io/docs/api-reference/](https://elevenlabs.io/docs/api-reference/)
- [https://elevenlabs.io/](https://elevenlabs.io/)
