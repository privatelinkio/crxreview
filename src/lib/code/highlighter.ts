/**
 * Syntax highlighting using Prism.js
 */

import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-less';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';

export interface HighlightResult {
  html: string;
  language: string;
}

/**
 * Highlight code using Prism.js
 * @param code - Code to highlight
 * @param language - Language identifier
 * @returns Highlighted HTML and language
 */
export function highlightCode(code: string, language: string): HighlightResult {
  try {
    // Validate that the language exists in Prism
    if (!Prism.languages[language]) {
      // Fallback to text if language not found
      return {
        html: escapeHtml(code),
        language: 'text',
      };
    }

    const highlighted = Prism.highlight(code, Prism.languages[language], language);
    return {
      html: highlighted,
      language,
    };
  } catch (error) {
    // Fallback to plain text if highlighting fails
    console.error(`Failed to highlight code for language ${language}:`, error);
    return {
      html: escapeHtml(code),
      language: 'text',
    };
  }
}

/**
 * Escape HTML special characters
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Get list of supported languages
 * @returns Array of supported language identifiers
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(Prism.languages).filter(
    (lang) => typeof Prism.languages[lang] === 'object'
  );
}

/**
 * Check if a language is supported
 * @param language - Language identifier
 * @returns True if language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return language in Prism.languages;
}
