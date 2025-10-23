
export const i18nBoostConfig:I18nBoostConfig = {
  // Path to your translation files folder (relative to workspace root)
  localesPath: 'src/i18n',
  
  // Default locale to navigate to on Ctrl+Click
  defaultLocale: 'en',
  
  // All supported locales in your project
  supportedLocales: ['en'],
  
  // Function names that indicate translation keys
  functionNames: ['t', 'translate', '$t', 'i18n.t'],
  
  // File naming pattern for your locale files
  // Options: 'locale.json', 'locale/common.json', 'locale/index.json'
  fileNamingPattern: 'locale.json',
  
  // Enable/disable the extension features
  enabled: true
};

interface I18nBoostConfig {
  localesPath: string;
  defaultLocale: string;
  supportedLocales: string[];
  functionNames: string[];
  fileNamingPattern: "locale.json" | "locale/common.json" | "locale/index.json";
  enabled: boolean;
}