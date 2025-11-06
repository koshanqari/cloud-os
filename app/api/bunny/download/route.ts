import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
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

    // Download file
    const response = await axios.get(url, {
      headers: {
        'AccessKey': password,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      responseType: 'arraybuffer',
    })

    // Return the file as a blob
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': response.headers['content-type'] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
      },
    })
  } catch (error: any) {
    console.error('Failed to download file:', error)
    
    if (error.response) {
      return NextResponse.json(
        { error: `Failed to download file: ${error.response.status} ${error.response.statusText}` },
        { status: error.response.status }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

