// Global gtag function for Google Analytics
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: {
        page_title?: string;
        page_location?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
        send_to?: string;
        [key: string]: string | number | boolean | undefined;
      }
    ) => void;
  }
}

export {};