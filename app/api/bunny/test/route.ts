import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { host, user, password } = body

    if (!host || !user || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Construct the base URL
    const cleanHost = host.replace(/^https?:\/\//, '')
    const baseUrl = `https://${cleanHost}/${user}/`

    // Test the connection
    try {
      const response = await axios.get(baseUrl, {
        headers: {
          'AccessKey': password,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      return NextResponse.json({
        success: response.status === 200,
      })
    } catch (error: any) {
      console.error('Bunny CDN connection test failed:', error)
      
      let errorMessage = 'Connection failed'
      if (error.response) {
        const status = error.response.status
        if (status === 401) {
          errorMessage = 'Authentication failed. Please check your Access Key (password).'
        } else if (status === 404) {
          errorMessage = 'Storage zone not found. Please check your User (storage zone name).'
        } else {
          errorMessage = `Server error: ${status} ${error.response.statusText}`
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check your network connection and credentials.'
      } else {
        errorMessage = error.message || 'Connection failed'
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
      })
    }
  } catch (error: any) {
    console.error('API route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

