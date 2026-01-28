# CRX Review

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Release](https://img.shields.io/badge/release-1.0.0-green.svg)](https://github.com/yourusername/crxreview/releases)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.x-brightgreen)](package.json)

A powerful, privacy-first web-based tool for analyzing and inspecting Chrome Extension (CRX) files. Extract, decode, and explore the contents of CRX packages with an intuitive interface—all processing happens locally in your browser.

## Features

- **CRX File Parsing**: Parse and validate Chrome Extension files with full CRX format support
- **Archive Exploration**: Browse extension file structures with a responsive tree view
- **Manifest Analysis**: Inspect extension configuration, permissions, and metadata
- **Code Syntax Highlighting**: Beautiful highlighting for 30+ languages via Prism.js
- **Full-Text Search**: Find content across all files with regex support
- **Smart Filtering**: Filter by file type, size, and name patterns
- **File Preview**: View code with formatting, images with scaling, and metadata for binaries
- **Download Support**: Export individual files, directory structures, or the complete CRX
- **Responsive Design**: Desktop, tablet, and mobile-optimized interface
- **Zero Server Interaction**: All processing happens locally—your files never leave your browser

## Quick Start

### Live Demo

Visit the hosted application: [https://yourdomain.com/crxreview](https://yourdomain.com/crxreview)

### Local Development

**Prerequisites**: Node.js 20.x or higher

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/crxreview.git
   cd crxreview
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser

4. **Build for production**:
   ```bash
   npm run build
   ```
   Output is in the `dist/` directory

5. **Preview production build**:
   ```bash
   npm run preview
   ```

## How to Use

### Basic Workflow

1. **Upload**: Click to select or drag-and-drop a `.crx` file
2. **Explore**: Browse the file tree in the left sidebar
3. **Inspect**: Click any file to view with syntax highlighting
4. **Search**: Find content across the extension
5. **Download**: Export files or the complete archive

### Key Features

- **Search & Filter**: Find specific code, config files, or resources
- **File Preview**: View code with proper formatting and colors
- **Manifest Analysis**: Understand permissions and configuration
- **Download Options**: Individual files or complete directories

See the [User Guide](USER_GUIDE.md) for detailed usage instructions.

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Syntax Highlighting**: Prism.js
- **Archive Handling**: JSZip
- **State Management**: Zustand
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Code Formatting**: js-beautify

## Project Structure

```
crxreview/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand store
│   ├── utils/              # Utility functions
│   ├── styles/             # Global styles
│   ├── types/              # TypeScript type definitions
│   └── App.tsx             # Root component
├── public/                 # Static assets
├── dist/                   # Production build output
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions CI/CD
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Development

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check code quality with ESLint |
| `npm run type-check` | Run TypeScript type checking |

### Code Quality

The project maintains high standards:

```bash
# Check code style
npm run lint

# Check types
npm run type-check

# Run all checks before committing
npm run lint && npm run type-check && npm run build
```

### Tools & Stack

- **TypeScript**: Full type safety
- **ESLint**: Code quality and consistency
- **Tailwind CSS**: Responsive design
- **Vite**: Lightning-fast builds
- **React 19**: Latest features and optimizations

See [Contributing Guide](CONTRIBUTING.md) for development setup details.

## Deployment

### GitHub Pages

This project is configured for automatic deployment to GitHub Pages via GitHub Actions.

#### Setup Steps

1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Under "Build and deployment", select "GitHub Actions" as source
4. The workflow will automatically deploy on push to main branch

#### Custom Domain

To use a custom domain:

1. Create a `CNAME` file in the `public/` directory with your domain name
2. Update DNS records to point to GitHub Pages IP addresses
3. Enable custom domain in GitHub Pages settings

See [GitHub Pages documentation](https://docs.github.com/en/pages) for more details.

### Manual Deployment

To deploy manually to a static host:

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the contents of the `dist/` directory to your hosting provider

### Environment Configuration

The application is configured with a base path of `/crxreview/` for GitHub Pages. To deploy elsewhere, update the `base` option in `vite.config.ts`.

## Bundle Size

The build produces optimized chunks:

- **vendor**: React ecosystem libraries (~450 KB gzipped)
- **syntax**: Prism.js syntax highlighting (~140 KB gzipped)
- **zip**: JSZip archive handling (~30 KB gzipped)
- **utils**: State management and utilities (~20 KB gzipped)
- **Main**: Application code (~500 KB total, split across chunks)

Total uncompressed: ~500 KB | Gzipped: ~200 KB

## Documentation

- **[User Guide](USER_GUIDE.md)**: How to use CRX Review
- **[Architecture](ARCHITECTURE.md)**: System design and components
- **[Troubleshooting](TROUBLESHOOTING.md)**: Common issues and solutions
- **[Contributing Guide](CONTRIBUTING.md)**: How to contribute
- **[Code of Conduct](CODE_OF_CONDUCT.md)**: Community standards
- **[Changelog](CHANGELOG.md)**: Version history and features

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome/Chromium | 88+ |
| Firefox | 87+ |
| Safari | 14+ |
| Edge | 88+ |

Mobile browsers (iOS Safari, Chrome Mobile) also supported.

## Known Limitations

- **File Size**: Limited by available browser memory (typically 512 MB - 2 GB)
- **Binary Previews**: Some formats may not display
- **Processing Time**: Large archives (100+ MB) take 30+ seconds to parse
- **View Only**: Cannot edit files or repackage extensions

See [Troubleshooting Guide](TROUBLESHOOTING.md) for solutions to common issues.

## Contributing

We welcome contributions! Here's how to get started:

1. Read the [Contributing Guide](CONTRIBUTING.md)
2. Check [Code of Conduct](CODE_OF_CONDUCT.md)
3. Fork the repository
4. Create a feature branch
5. Submit a Pull Request

See [Development Setup](CONTRIBUTING.md#development-setup) for detailed instructions.

## Getting Help

### Resources

- **Questions?**: Check [User Guide](USER_GUIDE.md)
- **Issues?**: See [Troubleshooting Guide](TROUBLESHOOTING.md)
- **Found a bug?**: Open a [GitHub Issue](https://github.com/yourusername/crxreview/issues)
- **Feature request?**: Start a [Discussion](https://github.com/yourusername/crxreview/discussions)

### Reporting Issues

Include:
- Browser and OS information
- Steps to reproduce
- Expected vs actual behavior
- Error messages from console (F12)

## Acknowledgments

CRX Review is built with amazing open-source projects:

- **[Vite](https://vitejs.dev/)** - Next generation frontend tooling
- **[React](https://react.dev/)** - JavaScript UI library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[TypeScript](https://www.typescriptlang.org/)** - Typed JavaScript
- **[JSZip](https://stuk.github.io/jszip/)** - ZIP file handling
- **[Prism.js](https://prismjs.com/)** - Syntax highlighting
- **[Zustand](https://github.com/pmndrs/zustand)** - State management
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[js-beautify](https://beautifier.io/)** - Code formatting

Special thanks to the original crxviewer project for inspiration.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

**Ready to get started?** Visit the [live application](https://yourdomain.com/crxreview) or check the [User Guide](USER_GUIDE.md) for instructions.
