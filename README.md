# Video to GIF Converter

A modern, browser-based tool for converting video files into high-quality GIF animations. All processing happens directly in your browser using WebAssembly - no uploads, no servers, complete privacy.

## Features

- 🎬 **Client-Side Processing** - Convert videos entirely in your browser using FFmpeg.wasm
- 🔒 **Privacy First** - Your videos never leave your device
- 🎨 **Dark Mode Support** - Beautiful interface that adapts to your preference
- ⚡ **Real-Time Preview** - See your video before conversion with playback controls
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- 🎯 **Drag & Drop** - Simple, intuitive file upload interface
- ⚙️ **Customizable Settings** - Control quality, frame rate, and dimensions
- 📊 **Live Progress** - Real-time conversion progress with status updates
- 💾 **Instant Download** - Get your GIF immediately after conversion

## How It Works

### Client-Side Processing

This application uses **FFmpeg.wasm**, a WebAssembly port of the popular FFmpeg video processing tool. This means:

- ✅ All video processing happens in your browser
- ✅ No files are uploaded to any server
- ✅ Complete privacy - your videos never leave your device
- ✅ No internet required after initial page load (except for first-time FFmpeg download)
- ✅ Fast processing without network delays

### Privacy & Security

- **No data collection**: We don't collect, store, or transmit any of your video files
- **No tracking**: No analytics or tracking scripts
- **No accounts**: No sign-up or login required
- **Open source**: Code is transparent and auditable
- **Client-side only**: Everything runs in your browser's sandbox

## Tech Stack

### Core Technologies

- **React 19.2** - UI framework with latest features
- **TypeScript 5.9** - Type safety with strict mode
- **Vite 7.1** - Build tool and dev server
- **Bun** - Primary package manager and runtime

### UI & Styling

- **HeroUI v2** - Modern component library
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **Framer Motion 12** - Smooth animations
- **tailwind-variants** - Component variant management

### Video Processing

- **FFmpeg.wasm** - WebAssembly-based video processing
- **@ffmpeg/ffmpeg** - FFmpeg core library
- **@ffmpeg/util** - FFmpeg utilities

### Code Quality

- **Biome** - Fast linter and formatter (replaces ESLint + Prettier)

## Getting Started

### Prerequisites

- Bun (recommended) or Node.js 18+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-directory>

# Install dependencies
bun install
```

### Development

```bash
# Start the development server
bun dev

# Open http://localhost:5173 in your browser
```

### Build for Production

```bash
# Create optimized production build
bun run build

# Preview production build locally
bun preview
```

## Usage

### Quick Start

1. **Upload Your Video**
   - Drag and drop a video file onto the upload zone, or
   - Click the upload area to browse and select a file

2. **Preview Your Video**
   - Watch your video with built-in playback controls
   - View video metadata (duration, dimensions)

3. **Customize Settings** (Optional)
   - **Quality**: Adjust from 1-100 (default: 80) - higher quality = larger file size
   - **Frame Rate**: Choose from 10, 15, 20, 24, or 30 fps (default: 15 fps)
   - **Dimensions**: Set output width (100-1920px) - height auto-adjusts to maintain aspect ratio
   - **Estimated Size**: See real-time file size estimates as you adjust settings

4. **Convert**
   - Click "Convert to GIF" button
   - Watch real-time progress updates
   - Wait for conversion to complete (time varies based on video length and settings)

5. **Download**
   - Click "Download GIF" to save your file
   - Use "Convert Another" to start over with a new video

### Tips for Best Results

- **For smaller file sizes**: Use lower quality (60-70), lower frame rate (10-15 fps), and smaller dimensions
- **For better quality**: Use higher quality (85-95), higher frame rate (24-30 fps), and larger dimensions
- **For web use**: Keep dimensions under 800px width and frame rate at 15 fps for good balance
- **For social media**: Check platform-specific GIF size limits (usually 8-15MB)

## Supported Video Formats

### Input Formats

The converter supports all common video formats:

- **MP4** (H.264, H.265/HEVC) - Most common format
- **WebM** (VP8, VP9) - Web-optimized format
- **MOV** (QuickTime) - Apple's video format
- **AVI** (Audio Video Interleave) - Legacy Windows format
- **MKV** (Matroska) - Container format
- **FLV** (Flash Video) - Legacy web format
- **WMV** (Windows Media Video) - Microsoft format
- **MPEG/MPG** - Standard video format

### Output Format

- **GIF** (Graphics Interchange Format) - Animated image format with optimized color palette

### File Size Limitations

- **Maximum file size**: 500MB (hard limit)
- **Recommended size**: Under 200MB for optimal performance
- **Warning threshold**: Files over 200MB will show a performance warning

Large files may take longer to process and consume more memory. For best results, use shorter videos or compress your video before conversion.

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── browser-compatibility-warning.tsx
│   ├── conversion-controls.tsx
│   ├── conversion-progress.tsx
│   ├── download-section.tsx
│   ├── error-message.tsx
│   ├── file-size-warning.tsx
│   ├── file-upload-zone.tsx
│   ├── navbar.tsx
│   ├── theme-switch.tsx
│   └── video-preview.tsx
├── config/              # App configuration
│   └── site.ts
├── layouts/             # Layout wrapper components
├── pages/               # Page-level components
│   ├── index.tsx
│   └── video-converter.tsx
├── services/            # Business logic services
│   └── ffmpeg-service.ts
├── styles/              # Global CSS styles
│   └── globals.css
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── browser-compatibility.ts
│   └── video-converter.ts
├── App.tsx              # Main app component
├── main.tsx             # Application entry point
└── provider.tsx         # Context providers
```

## Technical Details

### Conversion Process

1. **File Upload**: User selects or drops a video file
2. **Validation**: File format and size are validated
3. **Preview**: Video is loaded into HTML5 video player
4. **Metadata Extraction**: Duration, dimensions, and frame rate are extracted
5. **Settings Configuration**: User adjusts quality, frame rate, and dimensions
6. **FFmpeg Initialization**: FFmpeg.wasm loads (first time only)
7. **Processing**: Video is converted using FFmpeg with optimized settings
8. **Progress Updates**: Real-time progress feedback (0-100%)
9. **Output Generation**: GIF file is created as a Blob
10. **Download**: User downloads the generated GIF

### FFmpeg Command

The application uses an optimized FFmpeg command for high-quality GIF conversion:

```bash
ffmpeg -i input.mp4 \
  -vf "fps={frameRate},scale={width}:{height}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
  -loop 0 \
  output.gif
```

This command:
- Sets the frame rate
- Scales to desired dimensions using high-quality Lanczos algorithm
- Generates an optimized 256-color palette
- Applies dithering for better color representation
- Creates a looping GIF

### Memory Management

- Object URLs are cleaned up after use
- FFmpeg virtual filesystem is cleared after conversion
- Blob references are properly managed
- Maximum file size limits prevent memory issues

## Development Commands

```bash
# Run development server
bun dev

# Build for production
bun run build

# Preview production build
bun preview

# Lint and format code
bun run lint
```

## Configuration

- **Vite Config**: `vite.config.ts`
- **TypeScript**: `tsconfig.json`
- **Tailwind**: `tailwind.config.js`
- **Biome**: `biome.json`

## Browser Compatibility

### Minimum Requirements

The Video to GIF Converter requires a modern browser with the following features:

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 15+ | ✅ Fully Supported |
| iOS Safari | iOS 15+ | ✅ Fully Supported |
| Chrome Mobile | 90+ | ✅ Fully Supported |

### Required Browser Features

- **WebAssembly (WASM)** - For FFmpeg video processing
- **SharedArrayBuffer** - For multi-threaded processing
- **File API** - For handling file uploads
- **Blob URLs** - For file downloads
- **Web Workers** - For background processing
- **ES2020+ JavaScript** - Modern JavaScript features

### Checking Compatibility

The application automatically detects browser compatibility on load. If your browser doesn't support required features, you'll see a warning message with recommendations.

### Unsupported Browsers

- Internet Explorer (all versions)
- Chrome < 90
- Firefox < 88
- Safari < 15
- Older mobile browsers

If you're using an unsupported browser, please update to the latest version or switch to a modern browser.

## Troubleshooting

### Common Issues and Solutions

#### "Browser not supported" or "WebAssembly not available"

**Problem**: Your browser doesn't support required features.

**Solutions**:
- Update your browser to the latest version
- Switch to a supported browser (Chrome 90+, Firefox 88+, Safari 15+)
- Enable JavaScript if it's disabled
- Check if WebAssembly is enabled in browser settings

#### "Failed to load FFmpeg" or "Initialization error"

**Problem**: FFmpeg.wasm failed to load or initialize.

**Solutions**:
- Check your internet connection (FFmpeg files are loaded from CDN)
- Refresh the page and try again
- Clear browser cache and reload
- Disable browser extensions that might block WASM loading
- Check if your firewall or antivirus is blocking the CDN

#### "File format not supported"

**Problem**: The uploaded file format is not recognized.

**Solutions**:
- Ensure your file is a valid video format (MP4, WebM, MOV, AVI, etc.)
- Try converting your video to MP4 format first using another tool
- Check if the file is corrupted by playing it in a video player
- Ensure the file extension matches the actual format

#### "File too large" warning

**Problem**: Video file exceeds size limits.

**Solutions**:
- Use a video compressor to reduce file size before conversion
- Trim the video to a shorter duration
- Reduce video resolution before uploading
- Maximum supported size is 500MB

#### Conversion is very slow or freezes

**Problem**: Browser is struggling with video processing.

**Solutions**:
- Close other browser tabs to free up memory
- Reduce conversion settings (lower quality, frame rate, or dimensions)
- Use a shorter video clip
- Try on a device with more RAM
- Restart your browser and try again

#### "Out of memory" error

**Problem**: Browser ran out of available memory during conversion.

**Solutions**:
- Close unnecessary browser tabs and applications
- Reduce video dimensions (try 480px or 640px width)
- Lower the quality setting (try 60-70)
- Use a shorter video clip
- Restart your browser to clear memory
- Try on a device with more RAM

#### Conversion fails at high percentage (90%+)

**Problem**: Conversion fails near completion.

**Solutions**:
- Reduce output quality slightly
- Lower the frame rate
- Reduce dimensions
- Try a different video file to rule out corruption
- Clear browser cache and try again

#### Downloaded GIF won't play or is corrupted

**Problem**: The output GIF file doesn't work properly.

**Solutions**:
- Try downloading again
- Test the GIF in different applications/browsers
- Reduce conversion settings and try again
- Ensure conversion completed to 100% before downloading
- Check if your video file is corrupted

#### GIF quality is poor or pixelated

**Problem**: Output quality doesn't meet expectations.

**Solutions**:
- Increase quality setting (try 85-95)
- Increase frame rate for smoother animation
- Increase output dimensions
- Note: GIFs have a 256-color limit, so some quality loss is normal
- Consider if GIF is the right format for your needs

#### Mobile device issues

**Problem**: App doesn't work well on mobile.

**Solutions**:
- Ensure you're using a supported mobile browser (iOS Safari 15+, Chrome Mobile 90+)
- Use smaller video files on mobile (under 50MB recommended)
- Close other apps to free up memory
- Try on WiFi instead of cellular data for initial load
- Reduce conversion settings for better performance

### Performance Tips

- **Optimal settings for web**: 800px width, 15 fps, quality 75-80
- **Optimal settings for social media**: 640px width, 15 fps, quality 70-75
- **For high quality**: 1080px width, 24 fps, quality 85-90 (larger file size)
- **For small file size**: 480px width, 10 fps, quality 60-70

### Still Having Issues?

If you continue to experience problems:

1. Check the browser console (F12) for error messages
2. Try the application in an incognito/private window
3. Test with a different video file
4. Ensure your browser is fully updated
5. Try on a different device or browser

## License

MIT License - see [LICENSE](LICENSE) file for details

## Frequently Asked Questions

### Is this really free?

Yes, completely free and open source. No hidden costs, no subscriptions, no limits.

### Do I need to create an account?

No, the application works without any registration or login.

### How long does conversion take?

Conversion time depends on:
- Video length (longer videos take more time)
- Video resolution (higher resolution takes more time)
- Output settings (higher quality/frame rate takes more time)
- Your device's processing power

Typical times: 10-second video = 5-15 seconds, 1-minute video = 30-90 seconds

### What's the maximum video length?

There's no strict time limit, but the 500MB file size limit effectively caps video length. A 1080p video at 30fps is roughly 100MB per minute.

### Why is my GIF file so large?

GIF file size depends on:
- Output dimensions (larger = bigger file)
- Frame rate (more frames = bigger file)
- Quality setting (higher = bigger file)
- Video complexity (more motion/colors = bigger file)

Try reducing these settings for smaller files.

### Can I convert multiple videos at once?

Currently, the application processes one video at a time. Convert one, download it, then convert another.

### Does this work offline?

After the first load (which downloads FFmpeg.wasm), the application can work offline if you've cached the page. However, the first visit requires internet.

### Is there a mobile app?

No dedicated app, but the web application works great on mobile browsers (iOS Safari 15+, Chrome Mobile 90+).

### Can I use this for commercial projects?

Yes, the application is MIT licensed. You can use generated GIFs for any purpose, including commercial projects.

### Why GIF instead of other formats?

GIFs are widely supported across all platforms and don't require special players. They're perfect for:
- Social media posts
- Website animations
- Email signatures
- Documentation
- Presentations

For video content, consider using MP4 or WebM for better quality and smaller file sizes.

## Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

- Check existing issues before creating a new one
- Provide detailed information (browser, OS, video format, error messages)
- Include steps to reproduce the problem

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting (`bun run lint`)
5. Test your changes thoroughly
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines

- Follow the existing code style (enforced by Biome)
- Write TypeScript with strict type checking
- Use HeroUI components for consistency
- Test on multiple browsers
- Keep accessibility in mind
- Document new features

## Acknowledgments

- Built with [HeroUI](https://heroui.com/) component library
- Powered by [Vite](https://vitejs.dev/)
