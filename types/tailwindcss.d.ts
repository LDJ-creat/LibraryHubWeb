import 'tailwindcss/types/config';

declare module 'tailwindcss/types/config' {
  interface Config {
    // 只需要添加daisyui相关的配置
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
  }
}
