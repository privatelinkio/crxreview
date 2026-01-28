/**
 * Code processing utilities barrel export
 */

export {
  beautifyCode,
  canBeautify,
  minifyCode,
  type BeautifiableLanguage,
  type BeautifyOptions,
} from './beautifier';

export {
  highlightCode,
  getSupportedLanguages,
  isLanguageSupported,
  type HighlightResult,
} from './highlighter';

export {
  detectLanguageFromPath,
  detectLanguageFromMime,
  getPrismLanguage,
  isHighlightable,
  isTextFile,
  isImageFile,
  getFileCategory,
  type SupportedLanguage,
} from './language-detector';
