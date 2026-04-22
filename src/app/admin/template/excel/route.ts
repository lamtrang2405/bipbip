import * as XLSX from "xlsx";

export async function GET() {
  const workbook = XLSX.utils.book_new();

  const rows = [
    {
      title: "Cưng Chiều Riêng Em",
      author: "Lâm Anh Thư",
      summary: "Mô tả ngắn về truyện...",
      tags: "ngôn tình, ngọt sủng",
      completionStatus: "ongoing",
      totalChaptersPlanned: 70,
      thumbnailUrl: "",
      category: "Rebirth",
      chapterTitle: "Chương 1: Ngày đầu tái sinh",
      chapterContent: "Nội dung chương 1...",
    },
    {
      title: "Cưng Chiều Riêng Em",
      author: "Lâm Anh Thư",
      summary: "Mô tả ngắn về truyện...",
      tags: "ngôn tình, ngọt sủng",
      completionStatus: "ongoing",
      totalChaptersPlanned: 70,
      thumbnailUrl: "",
      category: "Rebirth",
      chapterTitle: "Chương 2: Công Tử Dịu Dàng",
      chapterContent: "Nội dung chương 2...",
    },
  ];

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "UploadTemplate");

  const content = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(content, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="cms-import-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
