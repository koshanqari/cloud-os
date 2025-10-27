'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button, Card, Spinner, EmptyState, Badge, ModalDialog, FieldText, FieldRange, Select } from './ui'
import { Table, DropdownMenu, DropdownItem, DropdownItemGroup } from './Table'
import { 
  MoreHorizontal, 
  Download, 
  Trash2, 
  Image as ImageIcon, 
  RefreshCw, 
  Folder, 
  FolderOpen, 
  File as FileIcon, 
  ChevronRight, 
  ChevronDown, 
  Home, 
  ArrowLeft,
  Copy,
  ChevronDown as ChevronDownIcon
} from 'lucide-react'
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
  const [folderTree, setFolderTree] = useState<BunnyFile[]>([])
  const [hasError, setHasError] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [folderContents, setFolderContents] = useState<Map<string, BunnyFile[]>>(new Map())
  const [showAddFolderModal, setShowAddFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showUploadDropdown, setShowUploadDropdown] = useState(false)
  const [uploadedFileForOptimization, setUploadedFileForOptimization] = useState<File | null>(null)

  // Create a fresh API instance with the current connection
  const api = useMemo(() => new BunnyAPI(connection), [connection])

  const loadFiles = async (path: string = '/') => {
    setIsLoading(true)
    setHasError(false)
    try {
      const fileList = await api.listFiles(path)
      setFiles(fileList)
      setCurrentPath(path)
    } catch (error) {
      console.error('Error loading files:', error)
      setHasError(true)
      if (!hasError) { // Only show error once
        onError('Failed to load files')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadFolderTree = async () => {
    try {
      const rootFiles = await api.listFiles('/')
      const folders = rootFiles.filter(file => file.IsDirectory)
      setFolderTree(folders)
    } catch (error) {
      console.error('Error loading folder tree:', error)
    }
  }

  useEffect(() => {
    if (connection) {
      loadFiles()
      loadFolderTree()
    }
  }, [connection])

  const onDrop = async (acceptedFiles: File[]) => {
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
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isLoading,
  })

  const handleDeleteFile = async (file: BunnyFile) => {
    if (window.confirm(`Are you sure you want to delete ${file.ObjectName}?`)) {
      try {
        // Construct the full file path including current directory
        const currentPathClean = currentPath === '/' ? '' : currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
        const fullFilePath = `${currentPathClean}/${file.ObjectName}`
        
        await api.deleteFile(fullFilePath)
        onSuccess(`File ${file.ObjectName} deleted successfully`)
        await loadFiles(currentPath)
      } catch (error) {
        console.error('Delete error:', error)
        onError(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleDownloadFile = async (file: BunnyFile) => {
    try {
      // Construct the full file path including current directory
      const currentPathClean = currentPath === '/' ? '' : currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
      const fullFilePath = `${currentPathClean}/${file.ObjectName}`
      
      const blob = await api.downloadFile(fullFilePath)
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

  const handleFolderClick = async (folder: BunnyFile) => {
    const newPath = folder.ObjectName.startsWith('/') ? folder.ObjectName : `/${folder.ObjectName}/`
    await loadFiles(newPath)
  }

  const handleFileClick = (file: BunnyFile) => {
    // Ensure proper URL construction
    const baseUrl = connection.url.endsWith('/') ? connection.url.slice(0, -1) : connection.url
    // Combine current path with filename
    const currentPathClean = currentPath === '/' ? '' : currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
    const filePath = `${currentPathClean}/${file.ObjectName}`
    const fileUrl = `${baseUrl}${filePath}`
    window.open(fileUrl, '_blank')
  }

  const handleCopyFileUrl = async (file: BunnyFile) => {
    try {
      // Construct the file URL
      const baseUrl = connection.url.endsWith('/') ? connection.url.slice(0, -1) : connection.url
      const currentPathClean = currentPath === '/' ? '' : currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
      const filePath = `${currentPathClean}/${file.ObjectName}`
      const fileUrl = `${baseUrl}${filePath}`
      
      await navigator.clipboard.writeText(fileUrl)
      onSuccess(`File URL copied to clipboard`)
    } catch (error) {
      onError('Failed to copy URL to clipboard')
    }
  }

  const getParentPath = (currentPath: string): string => {
    if (currentPath === '/') return '/'
    const pathParts = currentPath.split('/').filter(part => part !== '')
    if (pathParts.length <= 1) return '/'
    return '/' + pathParts.slice(0, -1).join('/') + '/'
  }

  const handleBackClick = async () => {
    const parentPath = getParentPath(currentPath)
    await loadFiles(parentPath)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      onError('Please enter a folder name')
      return
    }

    try {
      // Create folder by uploading a hidden .keep file
      const folderName = newFolderName.trim()
      const folderPath = currentPath === '/' ? `/${folderName}/` : `${currentPath}${folderName}/`
      
      // Create a hidden .keep file to establish the folder
      const keepFile = new File([''], '.keep', { type: 'text/plain' })
      await api.uploadFile(keepFile, folderPath)
      
      onSuccess(`Folder "${folderName}" created successfully`)
      setNewFolderName('')
      setShowAddFolderModal(false)
      
      // Refresh the file list and folder tree
      await loadFiles(currentPath)
      await loadFolderTree()
    } catch (error) {
      console.error('Folder creation error:', error)
      onError(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleUploadFile = () => {
    document.getElementById('file-upload')?.click()
    setShowUploadDropdown(false)
  }

  const handleOptimizeImageUpload = () => {
    document.getElementById('image-upload')?.click()
    setShowUploadDropdown(false)
  }

  const handleImageUploadForOptimization = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      // Create a temporary BunnyFile object for the uploaded image
      const tempFile: BunnyFile = {
        Guid: `temp-${Date.now()}`,
        StorageZoneName: connection.user,
        Path: currentPath,
        ObjectName: file.name,
        Length: file.size,
        LastChanged: new Date().toISOString(),
        ServerId: 0,
        ArrayNumber: 0,
        IsDirectory: false,
        UserId: connection.user,
        ContentType: file.type,
        DateCreated: new Date().toISOString(),
        StorageZoneId: 0,
        Checksum: null,
        ReplicatedZones: null,
      }
      setSelectedFile(tempFile)
      setUploadedFileForOptimization(file)
      setShowOptimizer(true)
    }
  }

  const toggleFolderExpansion = async (folder: BunnyFile) => {
    const folderPath = folder.ObjectName
    const isExpanded = expandedFolders.has(folderPath)
    
    if (isExpanded) {
      // Collapse folder
      setExpandedFolders(prev => {
        const newSet = new Set(prev)
        newSet.delete(folderPath)
        return newSet
      })
    } else {
      // Expand folder and load its contents
      setExpandedFolders(prev => new Set(prev).add(folderPath))
      
      // Only load contents if we haven't loaded them before
      if (!folderContents.has(folderPath)) {
        try {
          const contents = await api.listFiles(folderPath)
          const subfolders = contents.filter(file => file.IsDirectory)
          setFolderContents(prev => new Map(prev).set(folderPath, subfolders))
        } catch (error) {
          console.error('Error loading folder contents:', error)
          // Set empty array on error
          setFolderContents(prev => new Map(prev).set(folderPath, []))
        }
      }
    }
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

  const getFileType = (file: BunnyFile): string => {
    if (file.IsDirectory) {
      return 'Folder'
    }
    const extension = file.ObjectName.split('.').pop()?.toLowerCase()
    return extension ? extension.toUpperCase() : 'File'
  }

  const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
  }

  const getFileIcon = (file: BunnyFile) => {
    if (file.IsDirectory) {
      return <Folder className="w-4 h-4 text-blue-500" />
    } else if (isImageFile(file.ObjectName)) {
      return <ImageIcon className="w-4 h-4 text-green-500" />
    } else {
      return <FileIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const renderFolderTree = (folders: BunnyFile[], level: number = 0) => {
    return folders.map((folder) => {
      const isExpanded = expandedFolders.has(folder.ObjectName)
      const subfolders = folderContents.get(folder.ObjectName) || []
      
      return (
        <div key={folder.Guid}>
          <div className="flex items-center">
            <button
              onClick={() => toggleFolderExpansion(folder)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
            </button>
            <button
              onClick={() => handleFolderClick(folder)}
              className={`flex-1 flex items-center space-x-2 px-2 py-1 rounded text-left hover:bg-gray-100 ${
                currentPath === folder.ObjectName ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
              style={{ paddingLeft: `${level * 12}px` }}
            >
              <Folder className="w-4 h-4" />
              <span className="truncate">{folder.ObjectName}</span>
            </button>
          </div>
          {isExpanded && (
            <div className="ml-4">
              {subfolders.length > 0 ? (
                renderFolderTree(subfolders, level + 1)
              ) : (
                <div className="px-2 py-1 text-xs text-gray-400 italic">
                  No folders within
                </div>
              )}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="mb-3">
            <img src="/logo.png" alt="CloudOS Logo" className="w-full object-contain" />
          </div>
          <h3 className="font-semibold text-gray-900 text-center text-sm">Folders</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {/* Root Button */}
            <button
              onClick={() => loadFiles('/')}
              className={`w-full flex items-center space-x-2 px-2 py-2 rounded text-left hover:bg-gray-100 transition-colors ${
                currentPath === '/' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Root</span>
            </button>
            
            {/* Folder Tree */}
            {renderFolderTree(folderTree)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-bold text-gray-900">
                {currentPath === '/' ? '/' : currentPath}
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                appearance="subtle"
                onClick={() => loadFiles(currentPath)}
                loading={isLoading}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500">
                {connection.user}
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentPath !== '/' && (
                <Button
                  appearance="subtle"
                  onClick={handleBackClick}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="relative">
                <Button
                  appearance="primary"
                  onClick={() => setShowUploadDropdown(!showUploadDropdown)}
                >
                  Upload Files
                </Button>
                
                {showUploadDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUploadDropdown(false)}
                    />
                    <div className="absolute left-0 z-20 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 overflow-visible">
                      <div className="py-1">
                        <button
                          onClick={handleUploadFile}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        >
                          Upload File
                        </button>
                        <button
                          onClick={handleOptimizeImageUpload}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        >
                          Optimize Image
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Button
                appearance="secondary"
                onClick={() => setShowAddFolderModal(true)}
              >
                Add Folder
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files)
                    onDrop(files)
                  }
                }}
              />
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUploadForOptimization}
                  />
              {/* Additional buttons will go here */}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {files.length} items
              </span>
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 p-4 overflow-hidden">
          <Card className="h-full">
            <div className="p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-4">Files</h3>
              
              {isLoading ? (
                <div className="flex justify-center items-center flex-1">
                  <Spinner size="large" />
                </div>
              ) : hasError ? (
                <div className="flex justify-center items-center flex-1">
                  <EmptyState
                    header="Failed to load files"
                    description="There was an error loading the files. Please check your connection and try again."
                    action={
                      <Button 
                        appearance="primary" 
                        onClick={() => loadFiles(currentPath)}
                      >
                        Try Again
                      </Button>
                    }
                  />
                </div>
              ) : files.length === 0 ? (
                <div className="flex justify-center items-center flex-1">
                  <EmptyState
                    header="No files found"
                    description="Upload some files to get started"
                  />
                </div>
              ) : (
                <div className="flex-1 relative">
                  <div className="h-full overflow-y-auto overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Size</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Type</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((file) => (
                          <tr
                            key={file.Guid}
                            className="hover:bg-gray-50 cursor-pointer group"
                            onClick={() => file.IsDirectory ? handleFolderClick(file) : handleFileClick(file)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                {getFileIcon(file)}
                                <span className="font-medium text-gray-900 truncate">
                                  {file.ObjectName}
                                </span>
                                {!file.IsDirectory && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleCopyFileUrl(file); }}
                                    className="opacity-100 p-1 hover:bg-gray-100 rounded"
                                    title="Copy file URL"
                                  >
                                    <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(file.LastChanged)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {file.IsDirectory ? '—' : formatFileSize(file.Length)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {getFileType(file)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="opacity-100" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu trigger={<MoreHorizontal className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />}>
                                  <DropdownItemGroup>
                                    <DropdownItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDownloadFile(file); }}>
                                      <Download className="w-4 h-4 mr-2" /> Download
                                    </DropdownItem>
                                    {isImageFile(file.ObjectName) && !file.IsDirectory && (
                                      <DropdownItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleOptimizeImage(file); }}>
                                        <ImageIcon className="w-4 h-4 mr-2" /> Optimize Image
                                      </DropdownItem>
                                    )}
                                    <DropdownItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDeleteFile(file); }}>
                                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                                    </DropdownItem>
                                  </DropdownItemGroup>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

            {/* Image Optimizer Modal */}
            {showOptimizer && selectedFile && (
              <ModalDialog
                heading="Optimize Image"
                onClose={() => {
                  setShowOptimizer(false)
                  setUploadedFileForOptimization(null)
                }}
                width="full"
              >
                <ImageOptimizer
                  file={selectedFile}
                  connection={connection}
                  uploadedFile={uploadedFileForOptimization || undefined}
                  onClose={() => {
                    setShowOptimizer(false)
                    setUploadedFileForOptimization(null)
                  }}
                  onSuccess={(message) => {
                    onSuccess(message)
                    setShowOptimizer(false)
                    setUploadedFileForOptimization(null)
                    loadFiles(currentPath)
                  }}
                  onError={onError}
                />
              </ModalDialog>
            )}

        {/* Add Folder Modal */}
        {showAddFolderModal && (
          <ModalDialog
            heading="Create New Folder"
            onClose={() => {
              setShowAddFolderModal(false)
              setNewFolderName('')
            }}
            width="medium"
          >
            <div className="p-6">
              <FieldText
                label="Folder Name"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
              />
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  appearance="subtle"
                  onClick={() => {
                    setShowAddFolderModal(false)
                    setNewFolderName('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleCreateFolder}
                >
                  Create Folder
                </Button>
              </div>
            </div>
          </ModalDialog>
        )}
      </div>
    </div>
  )
}