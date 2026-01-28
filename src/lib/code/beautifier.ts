/**
 * Code beautification using js-beautify
 */

import { js as jsBeautify, css as cssBeautify, html as htmlBeautify } from 'js-beautify';

export interface BeautifyOptions {
  indent_size?: number;
  indent_char?: string;
  preserve_newlines?: boolean;
  max_preserve_newlines?: number;
  wrap_line_length?: number;
}

const DEFAULT_OPTIONS: BeautifyOptions = {
  indent_size: 2,
  indent_char: ' ',
  preserve_newlines: true,
  max_preserve_newlines: 2,
};

export type BeautifiableLanguage = 'javascript' | 'typescript' | 'jsx' | 'tsx' | 'html' | 'css' | 'scss' | 'less' | 'json';

/**
 * Check if a language can be beautified
 * @param language - Language identifier
 * @returns True if language supports beautification
 */
export function canBeautify(language: string): boolean {
  const beautifiableLanguages: BeautifiableLanguage[] = [
    'javascript', 'typescript', 'jsx', 'tsx',
    'html', 'css', 'scss', 'less', 'json',
  ];
  return beautifiableLanguages.includes(language as BeautifiableLanguage);
}

/**
 * Beautify code based on language
 * @param code - Code to beautify
 * @param language - Language identifier
 * @param options - Beautification options
 * @returns Beautified code
 */
export function beautifyCode(
  code: string,
  language: string,
  options?: BeautifyOptions
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'jsx':
      case 'tsx':
        return jsBeautify(code, opts);

      case 'html':
        return htmlBeautify(code, opts);

      case 'css':
      case 'scss':
      case 'less':
        return cssBeautify(code, opts);

      case 'json':
        // Parse and re-stringify for JSON beautification
        try {
          const parsed = JSON.parse(code);
          return JSON.stringify(parsed, null, opts.indent_size || 2);
        } catch {
          return code; // Return original if parsing fails
        }

      default:
        return code;
    }
  } catch (error) {
    console.error(`Failed to beautify code for language ${language}:`, error);
    return code; // Return original code if beautification fails
  }
}

/**
 * Minify code by removing unnecessary whitespace
 * @param code - Code to minify
 * @returns Minified code
 */
export function minifyCode(code: string): string {
  try {
    // Simple minification: remove leading/trailing whitespace and extra newlines
    return code
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');
  } catch (error) {
    console.error('Failed to minify code:', error);
    return code;
  }
}
