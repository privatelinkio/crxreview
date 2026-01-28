/**
 * Lazy loader for Prism.js language components
 *
 * Dynamically imports Prism language support only when needed,
 * reducing initial bundle size.
 */

import Prism from 'prismjs';

// Track loaded languages to avoid duplicate imports
const loadedLanguages = new Set<string>();

// Map of language identifiers to Prism component names
const languageComponentMap: Record<string, string> = {
  javascript: 'prism-javascript',
  js: 'prism-javascript',
  typescript: 'prism-typescript',
  ts: 'prism-typescript',
  jsx: 'prism-jsx',
  tsx: 'prism-tsx',
  html: 'prism-markup',
  xml: 'prism-markup',
  markup: 'prism-markup',
  css: 'prism-css',
  scss: 'prism-scss',
  sass: 'prism-scss',
  less: 'prism-less',
  json: 'prism-json',
  yaml: 'prism-yaml',
  yml: 'prism-yaml',
  python: 'prism-python',
  py: 'prism-python',
  ruby: 'prism-ruby',
  rb: 'prism-ruby',
  php: 'prism-php',
  go: 'prism-go',
  rust: 'prism-rust',
  rs: 'prism-rust',
  bash: 'prism-bash',
  shell: 'prism-bash',
  sh: 'prism-bash',
  markdown: 'prism-markdown',
  md: 'prism-markdown',
};

/**
 * Lazy load a Prism language component
 *
 * @param language - Language identifier
 * @returns Promise that resolves when language is loaded
 */
export async function loadPrismLanguage(language: string): Promise<void> {
  // Return early if language is already loaded
  if (loadedLanguages.has(language) || Prism.languages[language]) {
    return;
  }

  // Get the component name from the map
  const componentName = languageComponentMap[language.toLowerCase()];
  if (!componentName) {
    // Language not in our map, probably already loaded or unsupported
    return;
  }

  try {
    // Dynamically import the language component
    await import(
      /* webpackChunkName: "prism-[request]" */
      `prismjs/components/${componentName}`
    );

    // Mark as loaded
    loadedLanguages.add(language);
  } catch (error) {
    console.warn(`Failed to load Prism language component for ${language}:`, error);
  }
}

/**
 * Batch load multiple languages
 *
 * @param languages - Array of language identifiers
 * @returns Promise that resolves when all languages are loaded
 */
export async function loadPrismLanguages(languages: string[]): Promise<void> {
  const promises = languages.map((lang) => loadPrismLanguage(lang));
  await Promise.all(promises);
}

/**
 * Pre-load commonly used languages
 *
 * Call this early in the app initialization for better UX
 */
export async function preloadCommonLanguages(): Promise<void> {
  const commonLanguages = ['javascript', 'typescript', 'json', 'html', 'css', 'python'];
  await loadPrismLanguages(commonLanguages);
}

/**
 * Check if a language is supported (loaded or available)
 *
 * @param language - Language identifier
 * @returns True if the language is supported
 */
export function isPrismLanguageSupported(language: string): boolean {
  return language in Prism.languages || language.toLowerCase() in languageComponentMap;
}

/**
 * Get the list of all supported language identifiers
 *
 * @returns Array of supported language identifiers
 */
export function getSupportedPrismLanguages(): string[] {
  return Object.keys(languageComponentMap);
}
