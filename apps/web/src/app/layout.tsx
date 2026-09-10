import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider, LanguageProvider, Toaster, TopLoader } from '@wf-platform/uikit'
import zhCN from '../../../../locales/zh-CN.json'
import enUS from '../../../../locales/en-US.json'
import { getServerEnv, getClientConfig } from '../config/env'
import { ConfigProvider } from '../providers/ConfigProvider'
import { TopNav } from '../components/layout/TopNav'
import { BottomNav } from '../components/layout/BottomNav'
import { Footer } from '../components/layout/Footer'
import { Archivo_Black, Noto_Sans_SC } from 'next/font/google'

const archivoBlack = Archivo_Black({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo-black',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
});

import Web3Provider from '../components/Web3ProviderClient';

export const metadata: Metadata = {
  title: 'WF Platform',
  description: 'WF Platform Web3 Hub',
}

const resources = {
  "zh-CN": { translation: zhCN },
  "en-US": { translation: enUS },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const env = getServerEnv();
  const clientConfig = getClientConfig(env);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${archivoBlack.variable} ${notoSansSC.variable} bg-[#F3F4F8] text-black dark:bg-gray-900 dark:text-white transition-colors duration-300 min-h-screen flex flex-col`}>
        <ConfigProvider config={clientConfig}>
          <Web3Provider privyAppId={clientConfig.PRIVY_APP_ID} zeroDevProjectId={clientConfig.ZERODEV_PROJECT_ID}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <LanguageProvider defaultTranslations={resources}>
                <TopLoader />
                <TopNav />
                <main className="flex-grow pt-16 pb-24 lg:pb-0">
                  {children}
                </main>
                <BottomNav />
                <Footer />
                <Toaster richColors position="top-right" />
              </LanguageProvider>
            </ThemeProvider>
          </Web3Provider>
        </ConfigProvider>
      </body>
    </html>
  )
}
