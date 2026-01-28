/**
 * Marketing landing page
 *
 * Hero section with features showcase and CTA to start reviewing extensions
 */

import { Link } from 'react-router-dom';
import {
  Download,
  FileCode,
  Zap,
  Search,
  Github,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

export function LandingPage() {
  const features = [
    {
      icon: Download,
      title: 'Download CRX',
      description: 'Fetch any Chrome extension directly from the Web Store',
    },
    {
      icon: FileCode,
      title: 'View Source Code',
      description: 'Browse and inspect every file in the extension',
    },
    {
      icon: Shield,
      title: 'Security Analysis',
      description: 'Identify suspicious patterns and permissions',
    },
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Find functions, APIs, and code patterns instantly',
    },
    {
      icon: Zap,
      title: 'Fast & Offline',
      description: 'Runs entirely in your browser, no server required',
    },
    {
      icon: Layers,
      title: 'Deep Linking',
      description: 'Share specific files and searches via URL',
    },
  ];

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">crxreview</span>
          </div>
          <a
            href="https://github.com/brentlangston/crxreview"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <Github size={20} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Review Chrome Extensions
            <span className="block text-blue-600">Before Installing</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Inspect the source code of any Chrome extension directly in your browser.
            Verify permissions, detect suspicious patterns, and make informed decisions
            about what you install.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-lg"
            >
              Start Reviewing
              <ArrowRight size={20} />
            </Link>

            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition font-semibold text-lg"
            >
              Learn More
            </a>
          </div>

          <p className="text-gray-500 text-sm">
            100% free and open source. Runs entirely in your browser.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
            Powerful Features
          </h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Everything you need to understand and verify Chrome extensions
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition"
                >
                  <div className="inline-flex p-3 bg-blue-50 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Enter Extension Details',
              description:
                'Provide a Chrome Web Store URL, extension ID, or upload a CRX file',
            },
            {
              step: '2',
              title: 'Download & Extract',
              description:
                'crxreview automatically downloads the extension and extracts its contents',
            },
            {
              step: '3',
              title: 'Review & Analyze',
              description:
                'Browse files, search for patterns, and verify permissions in real-time',
            },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold text-lg mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Review?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Start analyzing Chrome extensions right now. No account required.
          </p>
          <Link
            to="/app"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition font-semibold text-lg"
          >
            Launch Reviewer
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-gray-900">crxreview</span>
              </div>
              <p className="text-sm text-gray-600">
                Review Chrome extensions safely and securely
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link to="/app" className="hover:text-gray-900 transition">
                    Viewer
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-gray-900 transition">
                    Features
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a
                    href="https://developer.chrome.com/docs/extensions/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-900 transition"
                  >
                    Chrome Extension Docs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Open Source</h4>
              <a
                href="https://github.com/brentlangston/crxreview"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
              >
                <Github size={18} />
                GitHub
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <p className="text-center text-sm text-gray-600">
              crxreview - Inspect Chrome Extensions Safely
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
