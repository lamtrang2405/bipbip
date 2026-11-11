const MAX_SHEET_BYTES = 30 * 1024 * 1024;

export class GoogleSheetError extends Error {}

export function parseSpreadsheetId(input: string): string | null {
  const value = input.trim();
  const fromUrl = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/)?.[1];
  if (fromUrl) return fromUrl;
  return /^[a-zA-Z0-9_-]{20,}$/.test(value) ? value : null;
}

/** Tải sheet (đã chia sẻ "Bất kỳ ai có đường liên kết") dưới dạng .xlsx. */
export async function fetchGoogleSheetXlsx(input: string): Promise<ArrayBuffer> {
  const id = parseSpreadsheetId(input);
  if (!id) throw new GoogleSheetError("Link Google Sheet không hợp lệ.");

  let res: Response;
  try {
    res = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new GoogleSheetError("Không kết nối được Google Sheets. Thử lại sau.");
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (res.status === 401 || res.status === 403 || contentType.includes("text/html")) {
    throw new GoogleSheetError(
      "Không đọc được sheet. Hãy bật chia sẻ \"Bất kỳ ai có đường liên kết\" (Người xem) và chắc chắn file là Google Trang tính (không phải file .xlsx gốc trên Drive).",
    );
  }
  if (res.status === 404) throw new GoogleSheetError("Không tìm thấy sheet. Kiểm tra lại link.");
  if (!res.ok) throw new GoogleSheetError(`Google Sheets trả lỗi ${res.status}.`);

  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_SHEET_BYTES) throw new GoogleSheetError("Sheet quá lớn (tối đa 30MB). Hãy tách thành nhiều sheet.");
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_SHEET_BYTES) {
    throw new GoogleSheetError("Sheet quá lớn (tối đa 30MB). Hãy tách thành nhiều sheet.");
  }
  return buffer;
}
