# CRX Review - Chrome Extension Parser and Viewer

A powerful web-based tool for analyzing and inspecting Chrome Extension (CRX) files. Extract, decode, and explore the contents of CRX packages with an intuitive interface.

## Features

- **CRX File Parsing**: Upload and parse Chrome Extension files (.crx)
- **Archive Exploration**: Browse the file structure of extensions
- **Manifest Analysis**: View and understand extension manifest configurations
- **Code Syntax Highlighting**: Beautiful syntax highlighting for source files (JavaScript, JSON, HTML, CSS)
- **File Preview**: Inspect individual files with proper formatting
- **Download Support**: Export extracted files and archive contents
- **Responsive Design**: Works seamlessly on desktop and tablet devices
- **Zero External Dependencies**: Runs entirely in the browser for privacy

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crxreview.git
cd crxreview
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Upload a CRX File**: Click the upload area or drag and drop a .crx file
2. **Explore Contents**: Navigate through the file structure using the sidebar
3. **View Files**: Click on any file to preview its contents with syntax highlighting
4. **Export Files**: Download individual files or the entire archive

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

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on source files |
| `npm run type-check` | Run TypeScript compiler without emitting |

### Code Quality

The project uses:
- **ESLint**: JavaScript/TypeScript linting
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS

Run linting:
```bash
npm run lint
```

Run type checking:
```bash
npm run type-check
```

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

## Troubleshooting

### Build Fails

**Issue**: `npm run build` fails with TypeScript errors
**Solution**: Run `npm run type-check` to see all errors, then fix them

### Development Server Not Starting

**Issue**: Port 5173 is already in use
**Solution**: Either kill the process using the port or specify a different port:
```bash
npm run dev -- --port 3000
```

### Large File Upload Issues

**Issue**: Cannot upload large CRX files
**Solution**: Browser memory limits may apply. Try smaller files or use a different browser

### Syntax Highlighting Not Working

**Issue**: Code doesn't show colored syntax highlighting
**Solution**: Ensure Prism.js CSS is loaded and the language is correctly detected

## Performance Tips

- Use the production build (`npm run build`) for testing
- Clear browser cache if you encounter stale content
- Use Chrome DevTools to profile performance bottlenecks
- Bundle analysis: Check the gzip sizes in the build output

## Browser Support

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

- Maximum file size depends on available browser memory
- Some binary files cannot be previewed
- Large archives may take time to process

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check existing documentation in the docs folder
- Review the API reference for implementation details

## Changelog

### v0.1.0 (Initial Release)
- Initial CRX parser implementation
- File exploration and preview
- Syntax highlighting support
- GitHub Pages deployment setup

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Syntax highlighting by [Prism.js](https://prismjs.com/)
- Archive handling by [JSZip](https://stuk.github.io/jszip/)

---

**Happy exploring!** For more information, visit the [project documentation](./DOCUMENTATION_INDEX.md).
