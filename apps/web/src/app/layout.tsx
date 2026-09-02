import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider, LanguageProvider } from '@wf-platform/uikit'
import zhCN from '../../../../locales/zh-CN.json'
import enUS from '../../../../locales/en-US.json'

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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <LanguageProvider defaultTranslations={resources}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
