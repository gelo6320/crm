import type { AppProps } from 'next/app';
import Head from 'next/head';
import './globals.css'; // importa i tuoi CSS globali se servono

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="application-name" content="CRM Costruzione Digitale" />
        <meta name="theme-color" content="#0070f3" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CRM" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}