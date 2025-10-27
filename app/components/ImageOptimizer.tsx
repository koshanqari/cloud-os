'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Card, FieldText, FieldRange } from './ui'
import { BunnyFile, BunnyConnection, ImageOptimizationOptions } from '../types/bunny'
import { BunnyAPI } from '../lib/bunny-api'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageOptimizerProps {
  file: BunnyFile
  connection: BunnyConnection
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (error: string) => void
  uploadedFile?: File // Optional uploaded file for new images
}

export default function ImageOptimizer({
  file,
  connection,
  onClose,
  onSuccess,
  onError,
  uploadedFile,
}: ImageOptimizerProps) {
  const [options, setOptions] = useState<ImageOptimizationOptions>({
    width: undefined,
    height: undefined,
    quality: 80,
    format: 'webp',
    crop: undefined,
  })
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [aspectRatio, setAspectRatio] = useState<string>('free')
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)

  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()

  const api = new BunnyAPI(connection)

  const formatOptions = [
    { label: 'WebP', value: 'webp' },
    { label: 'JPEG', value: 'jpeg' },
    { label: 'PNG', value: 'png' },
    { label: 'AVIF', value: 'avif' },
  ]

  const aspectRatioOptions = [
    { label: 'Free', value: 'free' },
    { label: 'Original', value: 'original' },
    { label: '1:1 (Square)', value: '1' },
    { label: '4:3', value: '4/3' },
    { label: '16:9', value: '16/9' },
    { label: '3:2', value: '3/2' },
    { label: '2:3 (Portrait)', value: '2/3' },
  ]

  useEffect(() => {
    // Set initial filename
    const baseName = file.ObjectName.split('/').pop()?.split('.')[0] || 'image'
    setNewFileName(baseName)
  }, [file])

  useEffect(() => {
    // Load original image for cropping
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setOriginalImage(img)
    }
    
    if (uploadedFile) {
      // For uploaded files, create object URL
      img.src = URL.createObjectURL(uploadedFile)
    } else {
      // For existing files, load from CDN
      img.src = `${connection.url}${file.ObjectName}`
    }
  }, [file, connection, uploadedFile])

  const handleOptimize = async () => {
    setIsOptimizing(true)
    try {
      let originalFile: File
      
      if (uploadedFile) {
        // Use the uploaded file directly
        originalFile = uploadedFile
      } else {
        // Fetch from CDN
        const blob = await fetch(`${connection.url}${file.ObjectName}`).then(res => res.blob())
        originalFile = new File([blob], file.ObjectName, { type: blob.type })
      }

      const finalOptions = { ...options }
      if (completedCrop && imgRef.current) {
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height
        finalOptions.crop = {
          x: completedCrop.x * scaleX,
          y: completedCrop.y * scaleY,
          width: completedCrop.width * scaleX,
          height: completedCrop.height * scaleY,
        }
      }

      const optimizedFile = await api.optimizeImage(originalFile, finalOptions)
      
      // Create new filename with format extension
      const extension = options.format || 'webp'
      const finalFileName = `${newFileName}.${extension}`
      
      // Upload the optimized file back to Bunny CDN
      await api.uploadFile(optimizedFile, file.Path)

      onSuccess(`Image optimized and saved as ${finalFileName}!`)
    } catch (error) {
      console.error('Error optimizing image:', error)
      onError('Failed to optimize image')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleAspectRatioChange = (ratio: string) => {
    setAspectRatio(ratio)
    if (ratio === 'free') {
      setCrop(undefined)
    } else if (ratio === 'original' && originalImage) {
      // Set crop to original image dimensions
      const imageAspect = originalImage.width / originalImage.height
      setCrop({
        unit: 'px',
        x: 0,
        y: 0,
        width: originalImage.width,
        height: originalImage.height,
      })
    } else {
      const [width, height] = ratio.split('/').map(Number)
      if (originalImage) {
        const imageAspect = originalImage.width / originalImage.height
        const cropAspect = width / height
        
        let cropWidth, cropHeight
        if (imageAspect > cropAspect) {
          cropHeight = Math.min(originalImage.height, originalImage.width / cropAspect)
          cropWidth = cropHeight * cropAspect
        } else {
          cropWidth = Math.min(originalImage.width, originalImage.height * cropAspect)
          cropHeight = cropWidth / cropAspect
        }
        
        setCrop({
          unit: 'px',
          x: (originalImage.width - cropWidth) / 2,
          y: (originalImage.height - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight,
        })
      }
    }
  }

  const resetCrop = () => {
    setCrop(undefined)
    setCompletedCrop(undefined)
  }

  return (
    <div className="space-y-6 p-6 max-w-[90vw] mx-auto">
      <div className="grid grid-cols-1 gap-6">
        {/* Crop Image Area */}
        <Card>
          <div className="p-4">
            <div className="w-full">
              {originalImage && (
                <ReactCrop 
                  crop={crop} 
                  onChange={c => setCrop(c)} 
                  onComplete={c => setCompletedCrop(c)}
                  aspect={aspectRatio === 'free' || aspectRatio === 'original' ? undefined : eval(aspectRatio)}
                  className="w-full"
                >
                  <img 
                    ref={imgRef} 
                    alt="Crop me" 
                    src={uploadedFile ? URL.createObjectURL(uploadedFile) : `${connection.url}${file.ObjectName}`}
                    className="w-full max-h-[50vh] object-contain"
                    style={{ maxWidth: '100%', maxHeight: '50vh' }}
                  />
                </ReactCrop>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Ratios */}
        <Card>
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-6">Quick Ratios</h3>
            <div className="flex flex-wrap gap-3">
              {aspectRatioOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAspectRatioChange(option.value)}
                  className={`px-6 py-3 rounded-md text-base font-medium transition-colors ${
                    aspectRatio === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* File Name and Format */}
        <Card>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* File Name */}
              <div>
                <div className="flex items-center">
                  <FieldText
                    label="File Name"
                    placeholder="Enter filename"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="text-base"
                  />
                  <span className="ml-3 text-base text-gray-500">
                    .{options.format || 'webp'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Extension (.{options.format || 'webp'}) is automatically preserved
                </p>
              </div>

              {/* File Format */}
              <div>
                <label className="block text-base font-medium mb-3">File Format</label>
                <select
                  value={options.format || 'webp'}
                  onChange={(e) => {
                    setOptions(prev => ({ ...prev, format: e.target.value as 'webp' | 'jpeg' | 'png' | 'avif' }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-atlassian-blue focus:border-transparent text-base"
                >
                  {formatOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Dimensions and Quality */}
        <Card>
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-6">Image Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Width */}
              <div>
                <FieldText
                  label="Width (px)"
                  placeholder="Auto"
                  type="number"
                  value={options.width ? String(options.width) : ''}
                  onChange={(e) => setOptions(prev => ({ ...prev, width: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="text-base"
                />
              </div>

              {/* Height */}
              <div>
                <FieldText
                  label="Height (px)"
                  placeholder="Auto"
                  type="number"
                  value={options.height ? String(options.height) : ''}
                  onChange={(e) => setOptions(prev => ({ ...prev, height: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="text-base"
                />
              </div>

              {/* Quality */}
              <div>
                <label className="block text-base font-medium mb-3">Quality: {options.quality}%</label>
                <FieldRange
                  min={10}
                  max={100}
                  step={5}
                  value={options.quality || 80}
                  onChange={(value) => setOptions(prev => ({ ...prev, quality: value }))}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Image Details */}
        <Card>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Original Image Details */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Original Image Details</h4>
                <div className="text-base text-gray-600 space-y-2">
                  <p><strong>File:</strong> {file.ObjectName}</p>
                  <p><strong>Size:</strong> {(file.Length / 1024).toFixed(2)} KB</p>
                  <p><strong>Dimensions:</strong> {originalImage ? `${originalImage.width} × ${originalImage.height}` : 'Loading...'}</p>
                </div>
              </div>

              {/* New Image Details */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">New Image Details</h4>
                <div className="text-base text-gray-600 space-y-2">
                  <p><strong>Format:</strong> {(options.format || 'webp').toUpperCase()}</p>
                  <p><strong>Quality:</strong> {options.quality}%</p>
                  <p><strong>Dimensions:</strong> {
                    options.width && options.height 
                      ? `${options.width} × ${options.height}` 
                      : options.width 
                        ? `${options.width} × Auto`
                        : options.height
                          ? `Auto × ${options.height}`
                          : 'Original'
                  }</p>
                  {completedCrop && (
                    <p><strong>Crop:</strong> {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card>
          <div className="p-8">
            <div className="flex justify-end space-x-4">
              <Button
                appearance="subtle"
                onClick={onClose}
                className="px-8 py-3 text-base"
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleOptimize}
                loading={isOptimizing}
                className="px-8 py-3 text-base"
              >
                Optimize & Save
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}