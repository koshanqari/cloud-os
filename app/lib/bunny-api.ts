import axios from 'axios'
import { BunnyConnection, BunnyFile, ImageOptimizationOptions } from '../types/bunny'

export class BunnyAPI {
  private connection: BunnyConnection

  constructor(connection: BunnyConnection) {
    this.connection = { ...connection } // Create a fresh copy
  }

  private getBaseUrl(): string {
    const host = this.connection.host || 'storage.bunnycdn.com'
    const user = this.connection.user
    // Remove protocol if present, we'll add https://
    const cleanHost = host.replace(/^https?:\/\//, '')
    return `https://${cleanHost}/${user}/`
  }

  private getHeaders() {
    return {
      'AccessKey': this.connection.password,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Use API route to proxy the request server-side (avoids CORS issues)
      const response = await axios.post('/api/bunny/test', {
        host: this.connection.host,
        user: this.connection.user,
        password: this.connection.password,
      })
      
      return response.data
    } catch (error: any) {
      console.error('Connection test failed:', error)
      
      // Handle API route errors
      if (error.response?.data) {
        return error.response.data
      }
      
      return {
        success: false,
        error: error.message || 'Connection failed. Please check your credentials and try again.',
      }
    }
  }

  async listFiles(path: string = '/'): Promise<BunnyFile[]> {
    try {
      // Use API route to proxy the request server-side (avoids CORS issues)
      const response = await axios.get('/api/bunny/files', {
        params: {
          host: this.connection.host,
          user: this.connection.user,
          password: this.connection.password,
          path: path,
        },
      })
      
      return response.data
    } catch (error: any) {
      console.error('Failed to list files:', error)
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Failed to list files')
    }
  }

  async uploadFile(file: File, path: string = '/'): Promise<void> {
    try {
      // Use API route to proxy the request server-side (avoids CORS issues)
      const formData = new FormData()
      formData.append('host', this.connection.host)
      formData.append('user', this.connection.user)
      formData.append('password', this.connection.password)
      formData.append('path', path)
      formData.append('file', file)
      
      await axios.post('/api/bunny/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } catch (error: any) {
      console.error('Failed to upload file:', error)
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Failed to upload file')
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      // Use API route to proxy the request server-side (avoids CORS issues)
      await axios.delete('/api/bunny/files', {
        params: {
          host: this.connection.host,
          user: this.connection.user,
          password: this.connection.password,
          path: path,
        },
      })
    } catch (error: any) {
      console.error('Failed to delete file:', error)
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Failed to delete file')
    }
  }

  async downloadFile(path: string): Promise<Blob> {
    try {
      // Use API route to proxy the request server-side (avoids CORS issues)
      const response = await axios.get('/api/bunny/download', {
        params: {
          host: this.connection.host,
          user: this.connection.user,
          password: this.connection.password,
          path: path,
        },
        responseType: 'blob',
      })
      return response.data
    } catch (error: any) {
      console.error('Failed to download file:', error)
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Failed to download file')
    }
  }

  getOptimizedImageUrl(path: string, options: ImageOptimizationOptions): string {
    const baseUrl = this.connection.url
    let optimizedUrl = `${baseUrl}${path}`

    const params = new URLSearchParams()
    
    if (options.width) params.append('width', options.width.toString())
    if (options.height) params.append('height', options.height.toString())
    if (options.quality) params.append('quality', options.quality.toString())
    if (options.format) params.append('format', options.format)
    
    if (options.crop) {
      params.append('crop', `${options.crop.x},${options.crop.y},${options.crop.width},${options.crop.height}`)
    }

    if (params.toString()) {
      optimizedUrl += `?${params.toString()}`
    }

    return optimizedUrl
  }

  async optimizeImage(file: File, options: ImageOptimizationOptions): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const { width = img.width, height = img.height, quality = 0.8, format = 'webp' } = options

        canvas.width = width
        canvas.height = height

        if (options.crop) {
          const { x, y, width: cropWidth, height: cropHeight } = options.crop
          ctx?.drawImage(img, x, y, cropWidth, cropHeight, 0, 0, width, height)
        } else {
          ctx?.drawImage(img, 0, 0, width, height)
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, `.${format}`), {
                type: `image/${format}`,
              })
              resolve(optimizedFile)
            } else {
              reject(new Error('Failed to optimize image'))
            }
          },
          `image/${format}`,
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }
}
