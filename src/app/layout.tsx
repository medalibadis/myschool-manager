import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { GlobalKeyboardShortcuts } from '../components/GlobalKeyboardShortcuts'

export const metadata: Metadata = {
  title: 'MySchool Manager',
  description: 'School administration and group management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
            <GlobalKeyboardShortcuts />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
