export type ProcessingTab = 'Shows' | 'Movies';

export const PROCESSING_TAB_STORAGE_KEY = 'jellyfin-capture-processing-tab';

export function readRememberedProcessingTab(): ProcessingTab {
  try {
    return window.localStorage.getItem(PROCESSING_TAB_STORAGE_KEY) === 'Movies'
      ? 'Movies'
      : 'Shows';
  } catch {
    return 'Shows';
  }
}

export function rememberProcessingTab(tab: ProcessingTab): void {
  try {
    window.localStorage.setItem(PROCESSING_TAB_STORAGE_KEY, tab);
  } catch {
    // Keep the selector usable if browser storage is unavailable.
  }
}
