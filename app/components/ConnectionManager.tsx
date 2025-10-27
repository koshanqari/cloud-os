'use client'

import { useState, useEffect } from 'react'
import { Button, Card, FieldText, Checkbox } from './ui'
import { BunnyConnection } from '../types/bunny'
import { BunnyAPI } from '../lib/bunny-api'

interface ConnectionManagerProps {
  onConnectionSuccess: (connection: BunnyConnection) => void
  onConnectionError: (error: string) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export default function ConnectionManager({
  onConnectionSuccess,
  onConnectionError,
  isLoading,
  setIsLoading,
}: ConnectionManagerProps) {
  const [formData, setFormData] = useState({
    host: 'storage.bunnycdn.com', // Fixed for Bunny CDN
    user: '', // Storage Zone Name
    password: '', // Access Key
    port: 443, // Fixed for Bunny CDN (HTTPS)
    url: '', // Pull Zone URL
    apiKey: '',
    libraryId: '',
  })
  const [useEnvVars, setUseEnvVars] = useState(true) // Default to true

  // Automatically load environment variables on component mount
  useEffect(() => {
    loadFromEnvVars()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const loadFromEnvVars = () => {
    setFormData({
      host: process.env.NEXT_PUBLIC_FTP_HOST || 'storage.bunnycdn.com',
      user: process.env.NEXT_PUBLIC_FTP_USER || '',
      password: process.env.NEXT_PUBLIC_FTP_PASSWORD || '',
      port: parseInt(process.env.NEXT_PUBLIC_FTP_PORT || '443'),
      url: process.env.NEXT_PUBLIC_FTP_URL || '',
      apiKey: process.env.NEXT_PUBLIC_FTP_API_KEY || '',
      libraryId: process.env.NEXT_PUBLIC_FTP_LIBRARY_ID || '',
    })
  }

  const handleConnect = async () => {
    if (!formData.user || !formData.password || !formData.url) {
      onConnectionError('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      const connection: BunnyConnection = {
        host: 'storage.bunnycdn.com', // Fixed host for Bunny CDN
        user: formData.user,
        password: formData.password,
        port: 443, // HTTPS port for Bunny CDN
        url: formData.url,
        apiKey: formData.apiKey || undefined,
        libraryId: formData.libraryId || undefined,
      }

      const api = new BunnyAPI(connection)
      const isConnected = await api.testConnection()

      if (isConnected) {
        onConnectionSuccess(connection)
      } else {
        onConnectionError('Failed to connect to server. Please check your credentials.')
      }
    } catch (error) {
      console.error('Connection error:', error)
      onConnectionError('Connection failed. Please check your credentials and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Connect to Bunny CDN</h2>
          
          <div className="mb-4">
            <Checkbox
              checked={useEnvVars}
              onChange={(e) => {
                setUseEnvVars(e.target.checked)
                if (e.target.checked) {
                  loadFromEnvVars()
                }
              }}
              label="Use environment variables"
            />
          </div>

          <div className="space-y-4">
            <FieldText
              label="Storage Zone Name"
              placeholder="Enter storage zone name (e.g., iba-consulting-prod)"
              value={formData.user}
              onChange={(e) => handleInputChange('user', e.target.value)}
              required
            />

            <FieldText
              label="Access Key"
              placeholder="Enter your access key"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              type="password"
              required
            />

            <FieldText
              label="URL"
              placeholder="https://your-pull-zone.b-cdn.net"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              required
            />

            <FieldText
              label="API Key (Optional)"
              placeholder="Enter your API key for advanced features"
              value={formData.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
            />

            <FieldText
              label="Library ID (Optional)"
              placeholder="Enter your library ID"
              value={formData.libraryId}
              onChange={(e) => handleInputChange('libraryId', e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              appearance="primary"
              onClick={handleConnect}
              loading={isLoading}
              disabled={isLoading}
            >
              Connect
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Environment Variables</h3>
            <p className="text-sm text-blue-700">
              You can also set these values in your .env.local file:
            </p>
            <pre className="text-xs text-blue-600 mt-2 bg-blue-100 p-2 rounded">
{`NEXT_PUBLIC_FTP_HOST=storage.bunnycdn.com
NEXT_PUBLIC_FTP_USER=your-storage-zone-name
NEXT_PUBLIC_FTP_PASSWORD=your-access-key
NEXT_PUBLIC_FTP_PORT=443
NEXT_PUBLIC_FTP_URL=https://your-pull-zone.b-cdn.net
NEXT_PUBLIC_FTP_API_KEY=your-api-key
NEXT_PUBLIC_FTP_LIBRARY_ID=your-library-id`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  )
}
