import { pdf } from "@react-pdf/renderer";
import type {
  LoadTestResultDashboardResponse,
  LoadTestResultSummary,
} from "@/api/generated/types.gen";
import { ResultPdfDocument } from "@/lib/result-pdf/result-pdf-document";
import { buildResultPdfFilename } from "@/lib/result-pdf/result-pdf-sections";

export type DownloadResultPdfInput = {
  dashboard: LoadTestResultDashboardResponse;
  result: LoadTestResultSummary;
};

export async function downloadResultPdf({
  dashboard,
  result,
}: DownloadResultPdfInput): Promise<void> {
  const blob = await pdf(
    <ResultPdfDocument dashboard={dashboard} result={result} />,
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildResultPdfFilename(dashboard, result);
  link.click();
  URL.revokeObjectURL(url);
}
