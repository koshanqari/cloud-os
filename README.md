# CloudOS File Manager

A modern file manager for Bunny CDN with image optimization features, built with Next.js and Atlassian Design System.

## Features

- 🔗 **Bunny CDN Integration**: Connect to your Bunny CDN storage zones
- 📁 **File Management**: Upload, download, and delete files
- 🖼️ **Image Optimization**: Crop, resize, and optimize images for web delivery
- 🎨 **Modern UI**: Built with Atlassian Design System and Tailwind CSS
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Bunny CDN account with storage zone

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Bunny CDN credentials in `.env.local`:
   ```
   BUNNY_STORAGE_ZONE_NAME=your-storage-zone-name
   BUNNY_STORAGE_ZONE_PASSWORD=your-storage-zone-password
   BUNNY_STORAGE_ZONE_REGION=ny
   BUNNY_PULL_ZONE_URL=https://your-pull-zone.b-cdn.net
   BUNNY_API_KEY=your-api-key (optional)
   BUNNY_LIBRARY_ID=your-library-id (optional)
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Connecting to Bunny CDN

1. Enter your Bunny CDN credentials in the connection form
2. Or use the "Use environment variables" checkbox to load from `.env.local`
3. Click "Connect" to establish the connection

### File Management

- **Upload**: Drag and drop files or click to select
- **Download**: Click the actions menu and select "Download"
- **Delete**: Click the actions menu and select "Delete"

### Image Optimization

1. Click the actions menu on any image file
2. Select "Optimize Image"
3. Adjust the optimization settings:
   - **Width/Height**: Set custom dimensions
   - **Quality**: Adjust compression quality (10-100%)
   - **Format**: Choose output format (WebP, JPEG, PNG, AVIF)
4. Generate a preview to see the results
5. Click "Optimize & Save" to create an optimized version

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Atlassian Design System**: UI components and design tokens
- **React Dropzone**: File upload handling
- **Sharp**: Image processing
- **Axios**: HTTP client for API calls

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BUNNY_STORAGE_ZONE_NAME` | Your Bunny CDN storage zone name | Yes |
| `BUNNY_STORAGE_ZONE_PASSWORD` | Your Bunny CDN storage zone password | Yes |
| `BUNNY_STORAGE_ZONE_REGION` | Your Bunny CDN storage zone region | Yes |
| `BUNNY_PULL_ZONE_URL` | Your Bunny CDN pull zone URL | Yes |
| `BUNNY_API_KEY` | Your Bunny CDN API key | No |
| `BUNNY_LIBRARY_ID` | Your Bunny CDN library ID | No |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
