import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider, LanguageProvider, Toaster } from '@wf-platform/uikit'
import zhCN from '../../../../locales/zh-CN.json'
import enUS from '../../../../locales/en-US.json'
import { getServerEnv, getClientConfig } from '../config/env'
import { ConfigProvider } from '../providers/ConfigProvider'
import dynamic from 'next/dynamic'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

const Web3Provider = dynamic(
  () => import('../components/Web3ProviderClient'),
  { ssr: false }
);

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
      <body className="bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
        <ConfigProvider config={clientConfig}>
          <Web3Provider privyAppId={clientConfig.PRIVY_APP_ID} zeroDevProjectId={clientConfig.ZERODEV_PROJECT_ID}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <LanguageProvider defaultTranslations={resources}>
                <Navbar />
                <main className="flex-grow pt-16">
                  {children}
                </main>
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
