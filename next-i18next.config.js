module.exports = {
    i18n: {
        defaultLocale: 'ko',
        locales: ['ko', 'ja', 'en'],
    },
    localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
    reloadOnPrerender: process.env.NODE_ENV === 'development',
};
