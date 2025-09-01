import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ColumnDef = { key: string; header: string; width?: number };

export async function exportToExcel(options: {
  columns: ColumnDef[];
  rows: Record<string, any>[];
  fileName: string;
  sheetName?: string;
}) {
  const { columns, rows, fileName, sheetName = "Report" } = options;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);

  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 20 }));
  rows.forEach((r) => ws.addRow(r));
  ws.getRow(1).font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(options: {
  title?: string;
  columns: { header: string; key: string }[];
  rows: Record<string, any>[];
  fileName: string;
  orientation?: "portrait" | "landscape";
}) {
  const { title, columns, rows, fileName, orientation = "portrait" } = options;
  const doc = new jsPDF({ orientation });
  if (title) {
    doc.setFontSize(14);
    doc.text(title, 14, 16);
  }
  autoTable(doc, {
    startY: title ? 22 : 10,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => r[c.key] ?? "")),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [33, 33, 33] },
  });
  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
