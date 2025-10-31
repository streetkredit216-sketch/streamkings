import type { Metadata } from 'next'
import './globals.css'
import { WalletProviderComponent } from '@/components/WalletProvider'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { ErrorProvider } from '@/contexts/ErrorContext'

export const metadata: Metadata = {
  title: 'Stream King',
  description: 'Stream King - Escape the Feed, Enter the Frequency',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-bank-gothic">
        <GoogleAnalytics />
        <WalletProviderComponent>
          <ErrorProvider>
            {children}
          </ErrorProvider>
        </WalletProviderComponent>
      </body>
    </html>
  )
} 