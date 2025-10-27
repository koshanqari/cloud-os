import axios from 'axios'
import { BunnyConnection, BunnyFile, ImageOptimizationOptions } from '../types/bunny'

export class BunnyAPI {
  private connection: BunnyConnection

  constructor(connection: BunnyConnection) {
    this.connection = { ...connection } // Create a fresh copy
  }

  private getBaseUrl(): string {
    const user = this.connection.user
    return `https://storage.bunnycdn.com/${user}/`
  }

  private getHeaders() {
    return {
      'AccessKey': this.connection.password,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.getBaseUrl()}`
      const response = await axios.get(url, {
        headers: this.getHeaders(),
      })
      return response.status === 200
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }

  async listFiles(path: string = '/'): Promise<BunnyFile[]> {
    try {
      // Ensure path starts with / for directories (baseUrl already ends with /)
      const normalizedPath = path === '/' ? '' : path.startsWith('/') ? path.substring(1) : path
      const baseUrl = this.getBaseUrl()
      const url = `${baseUrl}${normalizedPath}${normalizedPath ? '/' : ''}`
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to list files:', error)
      throw new Error('Failed to list files')
    }
  }

  async uploadFile(file: File, path: string = '/'): Promise<void> {
    try {
      // Normalize the path - remove leading slash if present since baseUrl already ends with /
      const normalizedPath = path === '/' ? '' : path.startsWith('/') ? path.substring(1) : path
      
      // Construct the full upload URL
      const uploadPath = `${this.getBaseUrl()}${normalizedPath}${file.name}`
      
      await axios.put(uploadPath, file, {
        headers: {
          'AccessKey': this.connection.password,
        },
      })
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw new Error('Failed to upload file')
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      // Ensure path starts with / for directories (baseUrl already ends with /)
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path
      await axios.delete(`${this.getBaseUrl()}${normalizedPath}`, {
        headers: {
          'AccessKey': this.connection.password,
        },
      })
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw new Error('Failed to delete file')
    }
  }

  async downloadFile(path: string): Promise<Blob> {
    try {
      // Ensure path starts with / for directories (baseUrl already ends with /)
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path
      const response = await axios.get(`${this.getBaseUrl()}${normalizedPath}`, {
        headers: this.getHeaders(),
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('Failed to download file:', error)
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
