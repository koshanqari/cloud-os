'use client'

import { useState } from 'react'
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
    host: 'storage.bunnycdn.com',
    user: '',
    password: '',
    port: 443,
    url: '',
  })
  const [useEnvVars, setUseEnvVars] = useState(false) // Default to false - don't auto-load

  // Don't automatically load environment variables - only load when user checks the box

  const handleInputChange = (field: string, value: string) => {
    if (field === 'port') {
      const portValue = value === '' ? 443 : parseInt(value, 10) || 443
      setFormData(prev => ({ ...prev, [field]: portValue }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const loadFromEnvVars = () => {
    setFormData({
      host: process.env.NEXT_PUBLIC_FTP_HOST || 'storage.bunnycdn.com',
      user: process.env.NEXT_PUBLIC_FTP_USER || '',
      password: process.env.NEXT_PUBLIC_FTP_PASSWORD || '',
      port: parseInt(process.env.NEXT_PUBLIC_FTP_PORT || '443'),
      url: process.env.NEXT_PUBLIC_FTP_URL || '',
    })
  }

  const handleConnect = async () => {
    if (!formData.host || !formData.user || !formData.password || !formData.url) {
      onConnectionError('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      const connection: BunnyConnection = {
        host: formData.host,
        user: formData.user,
        password: formData.password,
        port: formData.port,
        url: formData.url,
      }

      const api = new BunnyAPI(connection)
      const result = await api.testConnection()

      if (result.success) {
        onConnectionSuccess(connection)
      } else {
        onConnectionError(result.error || 'Failed to connect to server. Please check your credentials.')
      }
    } catch (error: any) {
      console.error('Connection error:', error)
      const errorMessage = error?.message || 'Connection failed. Please check your credentials and try again.'
      onConnectionError(errorMessage)
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
                const checked = e.target.checked
                setUseEnvVars(checked)
                if (checked) {
                  // Only load from env vars when checkbox is checked
                  loadFromEnvVars()
                } else {
                  // When unchecked, clear the form to default values
                  setFormData({
                    host: 'storage.bunnycdn.com',
                    user: '',
                    password: '',
                    port: 443,
                    url: '',
                  })
                }
              }}
              label="Load from environment variables"
            />
          </div>

          <div className="space-y-4">
            <FieldText
              label="Host"
              placeholder="storage.bunnycdn.com"
              value={formData.host}
              onChange={(e) => handleInputChange('host', e.target.value)}
              required
            />

            <FieldText
              label="User"
              placeholder="Enter storage zone name (e.g., iba-consulting-prod)"
              value={formData.user}
              onChange={(e) => handleInputChange('user', e.target.value)}
              required
            />

            <FieldText
              label="Pass"
              placeholder="Enter your access key"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              type="password"
              required
            />

            <FieldText
              label="Port"
              placeholder="443"
              value={formData.port ? formData.port.toString() : ''}
              onChange={(e) => handleInputChange('port', e.target.value)}
              type="number"
              required
            />

            <FieldText
              label="URL"
              placeholder="https://your-pull-zone.b-cdn.net"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              required
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
NEXT_PUBLIC_FTP_URL=https://your-pull-zone.b-cdn.net`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  )
}
