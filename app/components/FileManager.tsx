'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Card, Spinner, EmptyState, Badge, ModalDialog, FieldText, FieldRange, Select } from './ui'
import { Table, DropdownMenu, DropdownItem, DropdownItemGroup } from './Table'
import { MoreHorizontal, Download, Trash2, Image as ImageIcon, RefreshCw, Folder, FolderOpen, File } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { BunnyConnection, BunnyFile, ImageOptimizationOptions } from '../types/bunny'
import { BunnyAPI } from '../lib/bunny-api'
import ImageOptimizer from './ImageOptimizer'

interface FileManagerProps {
  connection: BunnyConnection
  onError: (error: string) => void
  onSuccess: (message: string) => void
}

export default function FileManager({ connection, onError, onSuccess }: FileManagerProps) {
  const [files, setFiles] = useState<BunnyFile[]>([])
  const [currentPath, setCurrentPath] = useState('/')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<BunnyFile | null>(null)
  const [showOptimizer, setShowOptimizer] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const api = new BunnyAPI(connection)

  const loadFiles = async (path: string = '/') => {
    setIsLoading(true)
    try {
      const fileList = await api.listFiles(path)
      setFiles(fileList)
      setCurrentPath(path)
    } catch (error) {
      console.error('Error loading files:', error)
      onError('Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [connection]) // Only run when connection changes

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        await api.uploadFile(file, currentPath)
        setUploadProgress(100)
        onSuccess(`File ${file.name} uploaded successfully`)
      } catch (error) {
        onError(`Failed to upload ${file.name}`)
      }
    }
    loadFiles(currentPath)
  }, [api, currentPath, onError, onSuccess, loadFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isLoading,
  })

  const handleDeleteFile = async (file: BunnyFile) => {
    if (window.confirm(`Are you sure you want to delete ${file.ObjectName}?`)) {
      try {
        await api.deleteFile(file.ObjectName)
        onSuccess(`File ${file.ObjectName} deleted successfully`)
        loadFiles(currentPath)
      } catch (error) {
        onError('Failed to delete file')
      }
    }
  }

  const handleDownloadFile = async (file: BunnyFile) => {
    try {
      const blob = await api.downloadFile(file.ObjectName)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.ObjectName.split('/').pop() || file.ObjectName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      onSuccess(`File ${file.ObjectName} downloaded successfully`)
    } catch (error) {
      onError('Failed to download file')
    }
  }

  const handleOptimizeImage = (file: BunnyFile) => {
    setSelectedFile(file)
    setShowOptimizer(true)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
  }

  const columns = [
    {
      key: 'name',
      content: 'Name',
      width: 40,
    },
    {
      key: 'size',
      content: 'Size',
      width: 15,
    },
    {
      key: 'date',
      content: 'Modified',
      width: 20,
    },
    {
      key: 'actions',
      content: 'Actions',
      width: 25,
    },
  ]

  const rows = files.map((file) => ({
    key: file.ObjectName,
    cells: [
      {
        key: 'name',
        content: (
          <div className="flex items-center space-x-2">
            <span className="font-medium">{file.ObjectName}</span>
            {isImageFile(file.ObjectName) && (
              <Badge appearance="info">Image</Badge>
            )}
            {file.IsDirectory && (
              <Badge appearance="success">Folder</Badge>
            )}
          </div>
        ),
      },
      {
        key: 'size',
        content: file.IsDirectory ? '—' : formatFileSize(file.Length),
      },
      {
        key: 'date',
        content: formatDate(file.LastChanged),
      },
      {
        key: 'actions',
        content: (
          <DropdownMenu trigger="Actions">
            <DropdownItemGroup>
              <DropdownItem onClick={() => handleDownloadFile(file)}>
                Download
              </DropdownItem>
              {isImageFile(file.ObjectName) && !file.IsDirectory && (
                <DropdownItem onClick={() => handleOptimizeImage(file)}>
                  Optimize Image
                </DropdownItem>
              )}
              <DropdownItem onClick={() => handleDeleteFile(file)}>
                Delete
              </DropdownItem>
            </DropdownItemGroup>
          </DropdownMenu>
        ),
      },
    ],
  }))

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <div className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-gray-500">or click to select files</p>
              <Button appearance="subtle">Choose Files</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* File List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Files</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Path: {currentPath}</span>
              <Button
                appearance="subtle"
                onClick={() => loadFiles(currentPath)}
                loading={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="large" />
            </div>
          ) : files.length === 0 ? (
            <EmptyState
              header="No files found"
              description="Upload some files to get started"
            />
          ) : (
            <Table columns={columns} rows={rows} />
          )}
        </div>
      </Card>

      {/* Image Optimizer Modal */}
      {showOptimizer && selectedFile && (
        <ModalDialog
          heading="Optimize Image"
          onClose={() => setShowOptimizer(false)}
          width="large"
        >
          <ImageOptimizer
            file={selectedFile}
            connection={connection}
            onClose={() => setShowOptimizer(false)}
            onSuccess={(message) => {
              onSuccess(message)
              setShowOptimizer(false)
              loadFiles(currentPath)
            }}
            onError={onError}
          />
        </ModalDialog>
      )}
    </div>
  )
}
