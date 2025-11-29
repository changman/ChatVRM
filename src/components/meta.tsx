import { buildUrl } from "@/utils/buildUrl";
import Head from "next/head";
import { useTranslation } from 'next-i18next';
export const Meta = () => {
  const { t } = useTranslation('common');
  const title = "ChatVRM";
  const description = t('meta.description');
  const imageUrl = "https://pixiv.github.io/ChatVRM/ogp.png";
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  );
};
