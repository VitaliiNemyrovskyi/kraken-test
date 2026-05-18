import { google, type sheets_v4 } from "googleapis";
import { getAuthedClient } from "./oauth.js";

export function getSheetsApi(): sheets_v4.Sheets | null {
  const auth = getAuthedClient();
  if (!auth) return null;
  return google.sheets({ version: "v4", auth });
}

export interface SheetRow {
  rowId: string;
  rowNumber: number;
  keyword: string;
  geo: string;
  language: string;
  brand: string;
  contentType: string;
  status: string;
  outputUrl: string;
}

const HEADERS = [
  "id",
  "keyword",
  "geo",
  "language",
  "brand",
  "content_type",
  "status",
  "output_url",
] as const;

export async function readSheetRows(
  sheetId: string,
  range: string,
): Promise<SheetRow[]> {
  const api = getSheetsApi();
  if (!api) throw new Error("Not authenticated with Google");
  const res = await api.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  const values = res.data.values ?? [];
  if (values.length === 0) return [];
  const headerRow = values[0]?.map((h) => String(h).trim().toLowerCase()) ?? [];
  const idx = (name: string) => headerRow.indexOf(name);
  const colIdx = {
    id: idx("id"),
    keyword: idx("keyword"),
    geo: idx("geo"),
    language: idx("language"),
    brand: idx("brand"),
    content_type: idx("content_type"),
    status: idx("status"),
    output_url: idx("output_url"),
  };
  const missing = HEADERS.filter((h) => colIdx[h] === -1);
  if (missing.length) {
    throw new Error(
      `Sheet missing required columns: ${missing.join(", ")}. Expected headers in row 1: ${HEADERS.join(", ")}`,
    );
  }
  const rows: SheetRow[] = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i] ?? [];
    const id = String(row[colIdx.id] ?? "").trim();
    const keyword = String(row[colIdx.keyword] ?? "").trim();
    if (!id || !keyword) continue;
    rows.push({
      rowId: id,
      rowNumber: i + 1,
      keyword,
      geo: String(row[colIdx.geo] ?? "").trim() || "us",
      language: String(row[colIdx.language] ?? "").trim() || "en",
      brand: String(row[colIdx.brand] ?? "").trim(),
      contentType: String(row[colIdx.content_type] ?? "").trim() || "review",
      status: String(row[colIdx.status] ?? "").trim() || "queued",
      outputUrl: String(row[colIdx.output_url] ?? "").trim(),
    });
  }
  return rows;
}

export async function writeStatusBack(
  sheetId: string,
  range: string,
  rowNumber: number,
  status: string,
  outputUrl: string | null,
): Promise<void> {
  const api = getSheetsApi();
  if (!api) throw new Error("Not authenticated with Google");
  const sheetName = range.split("!")[0] ?? "Sheet1";
  const statusCellRange = `${sheetName}!G${rowNumber}:H${rowNumber}`;
  await api.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: statusCellRange,
    valueInputOption: "RAW",
    requestBody: {
      values: [[status, outputUrl ?? ""]],
    },
  });
}
