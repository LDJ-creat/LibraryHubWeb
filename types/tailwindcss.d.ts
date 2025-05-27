// types/tailwindcss.d.ts

// Declare modules for plugins if TypeScript can't find their types
declare module '@tailwindcss/forms';
declare module '@tailwindcss/container-queries';
declare module 'daisyui';

// Augment the Tailwind CSS Config interface directly from the 'tailwindcss' module
declare module 'tailwindcss' {
  // Re-declare the Config interface to include all used properties
  // and the custom daisyui property.
  export interface Config {
    content: string[];
    theme?: {
      extend?: {
        fontFamily?: Record<string, string[]>;
        // Add other theme.extend properties as needed
        [key: string]: unknown; // Allow other extend properties
      };
      // Add other theme properties as needed
      [key: string]: unknown; // Allow other theme properties
    };
    plugins?: (
      | string
      | { handler: (...args: unknown[]) => void; config?: Record<string, unknown> }
      | ((...args: unknown[]) => void) // For plugins that are just functions
    )[];
    daisyui?: {
      themes?: boolean | string[];
      darkTheme?: string;
      base?: boolean;
      styled?: boolean;
      utils?: boolean;
      prefix?: string;
      logs?: boolean;
      themeRoot?: string;
      [key: string]: unknown;
    };
    // Add other standard Tailwind config properties if they cause errors
  }
}
