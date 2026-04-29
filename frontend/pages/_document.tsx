import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>DiagNote — AI Clinical Scribe</title>
        <meta name="description" content="AI-powered clinical documentation for healthcare professionals." />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}