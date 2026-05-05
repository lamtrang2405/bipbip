import { NextResponse } from "next/server";
import { createStory, createChapter } from "@/lib/repository";
import { slugify } from "@/lib/slugify";

export async function GET(request: Request) {
  // Prevent abuse in production
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 });
  }

  try {
    // 1. Phàm Nhân Tu Tiên
    const story1Title = "Phàm Nhân Tu Tiên";
    const story1 = await createStory({
      title: story1Title,
      slug: slugify(story1Title),
      summary: "Truyện kể về một thiếu niên nghèo khó bước chân vào giới tu tiên, trải qua muôn vàn gian khổ để đạt thành đại đạo.",
      coverUrl: "https://truyencv.vn/images/covers/pham-nhan-tu-tien.jpg",
      publishNow: true,
      author: "Vong Ngữ",
      category: "Tiên Hiệp",
      completionStatus: "ongoing",
      totalChaptersPlanned: 1000,
      tags: ["Tu Tiên", "Phàm Nhân"],
    });

    await createChapter({
      storyId: story1.id,
      chapterNumber: 1,
      title: "Sơn Thôn Hài Tử",
      slug: slugify("Sơn Thôn Hài Tử"),
      content: "Chương 1: Hàn Lập là một thiếu niên bình thường ở sơn thôn. Một ngày nọ, tam thúc trở về và mang theo hy vọng gia nhập Thất Huyền Môn... (Nội dung demo)",
      isPublished: true,
    });
    
    await createChapter({
      storyId: story1.id,
      chapterNumber: 2,
      title: "Luyện Cốt Quyết",
      slug: slugify("Luyện Cốt Quyết"),
      content: "Chương 2: Gia nhập Thất Huyền Môn, Hàn Lập tình cờ nhặt được một cái bình nhỏ kỳ lạ... (Nội dung demo 2)",
      isPublished: true,
    });

    // 2. Đấu Phá Thương Khung
    const story2Title = "Đấu Phá Thương Khung";
    const story2 = await createStory({
      title: story2Title,
      slug: slugify(story2Title),
      summary: "Nơi đây là thế giới thuộc về Đấu Khí, không có ma pháp hoa tiếu mị ảnh, thứ có, chỉ là Đấu Khí đã phồn diễn đến đỉnh cao!",
      coverUrl: "https://truyencv.vn/images/covers/dau-pha-thuong-khung.jpg",
      publishNow: true,
      author: "Thiên Tàm Thổ Đậu",
      category: "Huyền Huyễn",
      completionStatus: "completed",
      totalChaptersPlanned: 1641,
      tags: ["Đấu Khí", "Dị Hỏa"],
    });

    await createChapter({
      storyId: story2.id,
      chapterNumber: 1,
      title: "Thiên Tài Vẫn Lạc",
      slug: slugify("Thiên Tài Vẫn Lạc"),
      content: "Đấu chi khí, tam đoạn! Tiêu Viêm thẫn thờ nhìn lên bảng trắc nghiệm, không thể tin vào mắt mình...",
      isPublished: true,
    });

    return NextResponse.json({ message: "Seed data successfully inserted!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
