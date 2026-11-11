export const STORY_SHEET = "Truyen";
export const CHAPTER_SHEET = "Chuong";
export const GUIDE_SHEET = "HuongDan";

export type TemplateColumn = {
  key: string;
  label: string;
  required: boolean;
  note: string;
};

export const STORY_COLUMNS: TemplateColumn[] = [
  { key: "ma_truyen", label: "Mã truyện", required: true, note: "Slug duy nhất, dùng làm URL /stories/{ma_truyen}. Trùng mã truyện đã có = cập nhật truyện đó." },
  { key: "tieu_de", label: "Tiêu đề", required: true, note: "Bắt buộc khi tạo truyện mới." },
  { key: "tac_gia", label: "Tác giả", required: false, note: "" },
  { key: "tom_tat", label: "Tóm tắt", required: false, note: "Truyện mới để trống sẽ ghi \"Đang cập nhật\"." },
  { key: "the_loai", label: "Thể loại", required: false, note: "Nhiều thể loại cách nhau bởi dấu phẩy. Thể loại chưa có sẽ được tạo. Có giá trị = thay toàn bộ thể loại của truyện." },
  { key: "danh_muc", label: "Danh mục", required: false, note: "Một danh mục. Chưa có sẽ được tạo." },
  { key: "trang_thai", label: "Trạng thái", required: false, note: "Đang ra | Hoàn thành | Tạm ngưng (mặc định Đang ra)." },
  { key: "tong_chuong_du_kien", label: "Tổng chương dự kiến", required: false, note: "Số nguyên dương." },
  { key: "anh_bia_url", label: "Ảnh bìa URL", required: false, note: "Link ảnh jpg/png/webp hoặc link chia sẻ Google Drive (ảnh phải để chế độ ai có link đều xem được). Ảnh được tải về kho của web." },
  { key: "xuat_ban", label: "Xuất bản", required: false, note: "TRUE/FALSE (mặc định TRUE với truyện mới)." },
  { key: "de_cu", label: "Đề cử", required: false, note: "TRUE/FALSE – hiện ở mục Đề cử trang chủ." },
];

export const CHAPTER_COLUMNS: TemplateColumn[] = [
  { key: "ma_truyen", label: "Mã truyện", required: true, note: "Trùng với cột ma_truyen ở tab Truyen hoặc mã của truyện đã có trên web." },
  { key: "so_chuong", label: "Số chương", required: true, note: "Số nguyên dương. Trùng số chương đã có = ghi đè nội dung chương đó." },
  { key: "tieu_de_chuong", label: "Tiêu đề chương", required: false, note: "Để trống sẽ ghi \"Chương {so_chuong}\"." },
  { key: "noi_dung", label: "Nội dung", required: true, note: "Tối đa 50.000 ký tự mỗi ô (giới hạn Google Sheets). Xuống dòng trong ô được giữ nguyên." },
  { key: "xuat_ban", label: "Xuất bản", required: false, note: "TRUE/FALSE (mặc định TRUE)." },
];

export const STORY_EXAMPLE: Record<string, string | number | boolean> = {
  ma_truyen: "cung-chieu-rieng-em",
  tieu_de: "Cưng Chiều Riêng Em",
  tac_gia: "Lâm Anh Thư",
  tom_tat: "Mô tả ngắn về truyện...",
  the_loai: "Ngôn tình, Ngọt sủng",
  danh_muc: "Hiện đại",
  trang_thai: "Đang ra",
  tong_chuong_du_kien: 70,
  anh_bia_url: "",
  xuat_ban: true,
  de_cu: false,
};

export const CHAPTER_EXAMPLES: Record<string, string | number | boolean>[] = [
  { ma_truyen: "cung-chieu-rieng-em", so_chuong: 1, tieu_de_chuong: "Chương 1: Ngày đầu tái sinh", noi_dung: "Nội dung chương 1...", xuat_ban: true },
  { ma_truyen: "cung-chieu-rieng-em", so_chuong: 2, tieu_de_chuong: "Chương 2: Công tử dịu dàng", noi_dung: "Nội dung chương 2...", xuat_ban: true },
];

export const IMPORT_GUIDE_STEPS = [
  "Tải file template (.xlsx) từ trang Import.",
  "Mở Google Drive > Mới > Tải tệp lên, chọn file vừa tải.",
  "Mở file bằng Google Trang tính, chọn Tệp > Lưu dưới dạng Google Trang tính.",
  "Điền tab Truyen (mỗi dòng 1 truyện) và tab Chuong (mỗi dòng 1 chương). Giữ nguyên tên tab và dòng tiêu đề cột.",
  "Bấm Chia sẻ > Quyền truy cập chung: \"Bất kỳ ai có đường liên kết\" (Người xem), rồi sao chép link.",
  "Dán link vào trang Import, bấm Kiểm tra để xem trước, rồi Xác nhận import.",
  "Import xong nên tắt chia sẻ công khai của sheet.",
];
