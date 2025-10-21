# Video to GIF Converter

A modern, browser-based tool for converting video files into high-quality GIF animations. Built with React, TypeScript, and Vite for a fast and responsive user experience.

## Features

- 🎬 Convert video files to GIF format directly in your browser
- 🎨 Modern, clean UI with dark mode support
- ⚡ Fast processing powered by Vite
- 📱 Responsive design that works on all devices
- 🎯 Simple drag-and-drop interface
- ⚙️ Customizable output settings (frame rate, quality, dimensions)

## Tech Stack

- **React 19.2** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite 7.1** - Build tool and dev server
- **HeroUI v2** - Component library
- **Tailwind CSS 4.1** - Styling
- **Framer Motion 12** - Animations
- **Bun** - Primary package manager and runtime

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

1. Open the application in your browser
2. Click or drag-and-drop a video file onto the upload area
3. Adjust conversion settings (optional):
   - Frame rate
   - Output quality
   - Dimensions
4. Click "Convert to GIF"
5. Download your converted GIF file

## Supported Video Formats

- MP4
- WebM
- MOV
- AVI
- And more...

## Project Structure

```
src/
├── components/     # Reusable UI components
├── config/         # App configuration
├── layouts/        # Layout components
├── pages/          # Page components
├── styles/         # Global styles
└── types/          # TypeScript definitions
```

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

## Browser Support

Modern browsers with support for:
- ES2020+
- WebAssembly (for video processing)
- File API

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with [HeroUI](https://heroui.com/) component library
- Powered by [Vite](https://vitejs.dev/)
