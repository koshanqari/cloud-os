export interface BunnyConnection {
  host: string
  user: string
  password: string
  port: number
  url: string
  apiKey?: string
  libraryId?: string
}

export interface BunnyFile {
  Guid: string
  StorageZoneName: string
  Path: string
  ObjectName: string
  Length: number
  LastChanged: string
  ServerId: number
  ArrayNumber: number
  IsDirectory: boolean
  UserId: string
  ContentType: string
  DateCreated: string
  StorageZoneId: number
  Checksum: string | null
  ReplicatedZones: string | null
}

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
}
