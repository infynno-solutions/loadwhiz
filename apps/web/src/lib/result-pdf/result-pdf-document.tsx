import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type {
  LoadTestResultDashboardResponse,
  LoadTestResultSummary,
} from "@/api/generated/types.gen";
import {
  byUrlRows,
  distributionRows,
  formatPdfDate,
  overviewRows,
  responseCountRows,
  responseTimeRows,
  timeseriesRows,
} from "@/lib/result-pdf/result-pdf-sections";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#444",
    marginBottom: 2,
  },
  meta: {
    fontSize: 9,
    color: "#666",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 4,
  },
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  cell: {
    flex: 1,
    fontSize: 9,
  },
  cellWide: {
    flex: 2,
    fontSize: 9,
  },
  footer: {
    marginTop: 12,
    fontSize: 9,
    color: "#666",
  },
  error: {
    color: "#b91c1c",
    marginTop: 4,
  },
});

function KeyValueTable({
  rows,
  columns = ["Metric", "Value"],
}: {
  rows: { cells: string[] }[];
  columns?: string[];
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        {columns.map((col, i) => (
          <Text key={col} style={i === 0 ? styles.cell : styles.cell}>
            {col}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={styles.tableRow}>
          {row.cells.map((cell, j) => (
            <Text key={j} style={j === 0 ? styles.cell : styles.cell}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function MultiColumnTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: { cells: string[] }[];
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        {headers.map((h) => (
          <Text
            key={h}
            style={headers.length > 2 && h === headers[0] ? styles.cellWide : styles.cell}
          >
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={styles.tableRow}>
          {row.cells.map((cell, j) => (
            <Text
              key={j}
              style={j === 0 && headers.length > 2 ? styles.cellWide : styles.cell}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

type ResultPdfDocumentProps = {
  dashboard: LoadTestResultDashboardResponse;
  result: LoadTestResultSummary;
};

export function ResultPdfDocument({
  dashboard,
  result,
}: ResultPdfDocumentProps) {
  const { meta } = dashboard;
  const passLabel =
    meta.passed == null ? "—" : meta.passed ? "Passed" : "Failed";
  const timeRange = meta.finished_at
    ? `${formatPdfDate(meta.started_at)} — ${formatPdfDate(meta.finished_at)}`
    : formatPdfDate(meta.started_at);

  const tsRows = timeseriesRows(dashboard.timeseries ?? []);
  const urlRows = byUrlRows(dashboard.by_url ?? []);

  return (
    <Document title={`${meta.test_name} — Load test report`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{meta.test_name}</Text>
        <Text style={styles.subtitle}>LoadWhiz load test report</Text>
        <Text style={styles.meta}>
          {meta.load_description} · Status: {meta.status} · Result: {passLabel}
        </Text>
        <Text style={styles.meta}>{timeRange}</Text>
        <Text style={styles.meta}>
          Test ID: {meta.test_id} · Result ID: {meta.result_id}
        </Text>

        {result.error_message ? (
          <Text style={styles.error}>Error: {result.error_message}</Text>
        ) : null}
        {result.exit_code != null ? (
          <Text style={styles.footer}>Exit code: {result.exit_code}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Overview</Text>
        <KeyValueTable rows={overviewRows(dashboard, result)} />

        <Text style={styles.sectionTitle}>Response times</Text>
        <KeyValueTable rows={responseTimeRows(dashboard)} />

        <Text style={styles.sectionTitle}>Response counts & bandwidth</Text>
        <KeyValueTable rows={responseCountRows(dashboard)} />

        {tsRows.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              Requests over time
              {(dashboard.timeseries?.length ?? 0) > 60
                ? " (sampled)"
                : ""}
            </Text>
            <MultiColumnTable
              headers={["Time", "Requests", "Avg response", "Errors"]}
              rows={tsRows}
            />
          </>
        ) : null}

        {(dashboard.distribution?.length ?? 0) > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Latency distribution</Text>
            <MultiColumnTable
              headers={["Bucket", "Count"]}
              rows={distributionRows(dashboard.distribution ?? [])}
            />
          </>
        ) : null}
      </Page>

      {urlRows.length > 0 ? (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Per-URL breakdown</Text>
          {(dashboard.by_url?.length ?? 0) > 40 ? (
            <Text style={styles.meta}>Showing first 40 endpoints</Text>
          ) : null}
          <MultiColumnTable
            headers={["Endpoint", "Requests", "Avg", "Error %"]}
            rows={urlRows}
          />
          <Text style={styles.footer}>
            Generated by LoadWhiz · {new Date().toLocaleString()}
          </Text>
        </Page>
      ) : (
        <Page size="A4" style={styles.page}>
          <Text style={styles.footer}>
            Generated by LoadWhiz · {new Date().toLocaleString()}
          </Text>
        </Page>
      )}
    </Document>
  );
}
