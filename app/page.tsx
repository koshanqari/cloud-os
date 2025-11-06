'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, X } from 'lucide-react'
import ConnectionManager from './components/ConnectionManager'
import FileManager from './components/FileManagerNew'
import { BunnyConnection } from './types/bunny'

interface Flag {
  id: number
  appearance: 'success' | 'error'
  title: string
  description: string
}

export default function Home() {
  const [connection, setConnection] = useState<BunnyConnection | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [flags, setFlags] = useState<Flag[]>([])

  const addFlag = (flag: Omit<Flag, 'id'>) => {
    const id = Date.now()
    setFlags(prev => [...prev, { ...flag, id }])
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      removeFlag(id)
    }, 5000)
  }

  const removeFlag = (id: number) => {
    setFlags(prev => prev.filter(flag => flag.id !== id))
  }

  const handleConnectionSuccess = (conn: BunnyConnection) => {
    setConnection(conn)
    addFlag({
      appearance: 'success',
      title: 'Connection Successful',
      description: `Connected to ${conn.host}`,
    })
  }

  const handleConnectionError = (error: string) => {
    addFlag({
      appearance: 'error',
      title: 'Connection Failed',
      description: error,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!connection ? (
        <>
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-3">
                  <Image src="/logo.png" alt="CloudOS Logo" width={40} height={40} className="w-10 h-10 object-contain" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">CloudOS File Manager</h1>
                    <p className="text-gray-600 text-sm">
                      Manage your Bunny CDN files with optimization features
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ConnectionManager
              onConnectionSuccess={handleConnectionSuccess}
              onConnectionError={handleConnectionError}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </main>
        </>
          ) : (
            <FileManager
              key={connection.user} // Force re-render when connection changes
              connection={connection}
              onError={(error) => handleConnectionError(error)}
              onSuccess={(message) => addFlag({
                appearance: 'success',
                title: 'Success',
                description: message,
              })}
              onDisconnect={() => {
                setConnection(null)
                addFlag({
                  appearance: 'success',
                  title: 'Disconnected',
                  description: 'Successfully disconnected from storage',
                })
              }}
            />
          )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50 w-80 max-w-sm sm:max-w-md">
        {flags.map(flag => (
          <div
            key={flag.id}
            className={`w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
              flag.appearance === 'success' ? 'border-l-4 border-green-400' : 'border-l-4 border-red-400'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {flag.appearance === 'success' ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-400" />
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{flag.title}</p>
                  <p className="mt-1 text-sm text-gray-500 break-words">{flag.description}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => removeFlag(flag.id)}
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
