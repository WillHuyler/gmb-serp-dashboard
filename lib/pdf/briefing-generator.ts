export interface PrintBriefingConfig {
  clientName: string;
  generatedAt: string;
  certifiedStatus: string;
}

export class BriefingPDFGenerator {
  /**
   * Prepares the document title and triggers browser print optimized export.
   */
  static exportToPDF(config: PrintBriefingConfig): void {
    if (typeof window === 'undefined') return;

    const originalTitle = document.title;
    const sanitizedClient = config.clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStamp = new Date().toISOString().split('T')[0];

    document.title = `Executive_Briefing_${sanitizedClient}_${dateStamp}`;
    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }
}
