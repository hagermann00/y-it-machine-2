import { Book, ExportSettings } from "../types";

/**
 * Lazy-loaded PDF export wrapper that dynamically imports jsPDF only when needed
 */
export const downloadPdfLazy = async (book: Book, settings: ExportSettings): Promise<void> => {
  const { downloadPdf } = await import(
    /* webpackChunkName: "pdf-export" */
    "./pdfExport"
  );
  downloadPdf(book, settings);
};
