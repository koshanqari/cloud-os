import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const host = searchParams.get('host')
    const user = searchParams.get('user')
    const password = searchParams.get('password')
    const path = searchParams.get('path') || '/'

    if (!host || !user || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Construct the base URL
    const cleanHost = host.replace(/^https?:\/\//, '')
    const baseUrl = `https://${cleanHost}/${user}/`
    
    // Normalize path
    const normalizedPath = path === '/' ? '' : path.startsWith('/') ? path.substring(1) : path
    const url = `${baseUrl}${normalizedPath}${normalizedPath ? '/' : ''}`

    // List files
    const response = await axios.get(url, {
      headers: {
        'AccessKey': password,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Failed to list files:', error)
    
    if (error.response) {
      return NextResponse.json(
        { error: `Failed to list files: ${error.response.status} ${error.response.statusText}` },
        { status: error.response.status }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const host = formData.get('host') as string
    const user = formData.get('user') as string
    const password = formData.get('password') as string
    const path = (formData.get('path') as string) || '/'
    const file = formData.get('file') as File

    if (!host || !user || !password || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Construct the base URL
    const cleanHost = host.replace(/^https?:\/\//, '')
    const baseUrl = `https://${cleanHost}/${user}/`
    
    // Normalize path
    const normalizedPath = path === '/' ? '' : path.startsWith('/') ? path.substring(1) : path
    const uploadPath = `${baseUrl}${normalizedPath}${file.name}`

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file
    await axios.put(uploadPath, buffer, {
      headers: {
        'AccessKey': password,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to upload file:', error)
    
    if (error.response) {
      return NextResponse.json(
        { error: `Failed to upload file: ${error.response.status} ${error.response.statusText}` },
        { status: error.response.status }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const host = searchParams.get('host')
    const user = searchParams.get('user')
    const password = searchParams.get('password')
    const path = searchParams.get('path')

    if (!host || !user || !password || !path) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Construct the base URL
    const cleanHost = host.replace(/^https?:\/\//, '')
    const baseUrl = `https://${cleanHost}/${user}/`
    
    // Normalize path
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path
    const url = `${baseUrl}${normalizedPath}`

    // Delete file
    await axios.delete(url, {
      headers: {
        'AccessKey': password,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete file:', error)
    
    if (error.response) {
      return NextResponse.json(
        { error: `Failed to delete file: ${error.response.status} ${error.response.statusText}` },
        { status: error.response.status }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

