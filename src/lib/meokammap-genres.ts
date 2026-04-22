/**
 * Danh sách thể loại tham chiếu trang https://meokammap.com/the-loai
 * (Trang gốc có Cloudflare — nếu bạn cần khớp 100%, hãy gửi HTML/ảnh danh sách để cập nhật.)
 */
export const MEOKAMMAP_THE_LOAI = [
  "Bách hợp",
  "BE",
  "Bình tĩnh cường",
  "Chữa lành",
  "Cổ đại",
  "Cung đấu",
  "Cứu rỗi",
  "Đại Nữ Chủ",
  "Đam mỹ",
  "Dị giới",
  "Đời thường",
  "Gia đình",
  "Hài hước",
  "Hậu cung",
  "HE",
  "Hiện đại",
  "Học đường",
  "Kinh dị",
  "Lịch sử",
  "Ngược",
  "Ngọt sủng",
  "Ngôn tình",
  "Nữ cường",
  "Quân sự",
  "Sci-fi",
  "Showbiz",
  "Tình cảm hiện thực",
  "Tiên hiệp",
  "Trinh thám",
  "Trọng sinh",
  "Tổng tài",
  "Tu tiên",
  "Văn phòng",
  "Võ hiệp",
  "Xuyên không",
] as const;

export type MeokammapTheLoai = (typeof MEOKAMMAP_THE_LOAI)[number];
