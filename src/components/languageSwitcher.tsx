import { useRouter } from 'next/router';
import { IconButton } from './iconButton';
import { useState } from 'react';

export const LanguageSwitcher = () => {
    const router = useRouter();
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);

    const changeLanguage = (locale: string) => {
        router.push(router.pathname, router.asPath, { locale });
        setShowLanguageMenu(false);
    };

    const languages = [
        { code: 'ko', name: '한국어', flag: '🇰🇷' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
    ];

    const currentLanguage = languages.find(lang => lang.code === router.locale);

    return (
        <div className="relative">
            <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8 font-bold flex items-center gap-8"
            >
                <span>{currentLanguage?.flag}</span>
                <span>{currentLanguage?.name}</span>
            </button>

            {showLanguageMenu && (
                <div className="absolute top-full mt-8 right-0 bg-white rounded-8 shadow-lg overflow-hidden z-50 min-w-[160px]">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full px-16 py-8 text-left hover:bg-surface1-hover flex items-center gap-8 ${router.locale === lang.code ? 'bg-surface1' : ''
                                }`}
                        >
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
