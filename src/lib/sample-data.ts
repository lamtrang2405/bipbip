import { Chapter, StoryWithChapters } from "@/types/story";

const now = new Date().toISOString();

export const sampleStories: StoryWithChapters[] = [
  {
    id: "story-1",
    title: "Mua Tren Pho Cu",
    slug: "mua-tren-pho-cu",
    summary:
      "Mot chuyen tinh nhe nhang giua thanh pho cu, noi moi chuong la mot ky niem.",
    coverUrl: "/covers/mua-tren-pho-cu.svg",
    status: "published",
    isFeatured: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    tags: [
      { id: "tag-1", name: "Ngon Tinh", slug: "ngon-tinh" },
      { id: "tag-2", name: "Hien Dai", slug: "hien-dai" },
    ],
    chapters: [
      {
        id: "chapter-1",
        storyId: "story-1",
        chapterNumber: 1,
        title: "Ngay Troi Chuyen Mua",
        slug: "ngay-troi-chuyen-mua",
        content:
          "Toi gap em vao mot buoi chieu muon, khi con duong pho co bat dau thoang mui mua.",
        isPublished: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "chapter-2",
        storyId: "story-1",
        chapterNumber: 2,
        title: "Ban Cong Nho",
        slug: "ban-cong-nho",
        content:
          "Chung toi noi chuyen tren ban cong nho, nhin den den pho va ke nhau nghe ve uoc mo.",
        isPublished: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
  },
  {
    id: "story-2",
    title: "Ho So Cua Mat Trang",
    slug: "ho-so-cua-mat-trang",
    summary:
      "Trinh tham tam ly voi nhieu manh moi cat ghep xoay quanh mot thu vien co.",
    coverUrl: "/covers/ho-so-cua-mat-trang.svg",
    status: "published",
    isFeatured: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    tags: [{ id: "tag-3", name: "Trinh Tham", slug: "trinh-tham" }],
    chapters: [
      {
        id: "chapter-3",
        storyId: "story-2",
        chapterNumber: 1,
        title: "Thu Vien Dong Cua Luc 9 Gio",
        slug: "thu-vien-dong-cua-luc-9-gio",
        content:
          "Ca thanh pho don dai ve mot la thu vo danh xuat hien trong ngan sach co.",
        isPublished: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "chapter-3b",
        storyId: "story-2",
        chapterNumber: 2,
        title: "Can Phong Dong Bang",
        slug: "can-phong-dong-bang",
        content:
          "Trong ngan ke cuoi cung, co mot phong bi niem phong giam phong khong dau vet.",
        isPublished: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
  },
  {
    id: "story-3",
    title: "Pho Dem Khong Ngu",
    slug: "pho-dem-khong-ngu",
    summary:
      "Do thi ve dem, nhung cuoc gap tinh co va mot bi mat chua ai biet.",
    coverUrl: null,
    status: "published",
    isFeatured: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    tags: [{ id: "tag-4", name: "Do Thi", slug: "do-thi" }],
    chapters: [
      {
        id: "chapter-4",
        storyId: "story-3",
        chapterNumber: 1,
        title: "Nguoi Tren Cau Vuot",
        slug: "nguoi-tren-cau-vuot",
        content:
          "Dem nay gio lon, den duong dai vang, va mot bong nguoi dung im tren cau.",
        isPublished: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "chapter-4b",
        storyId: "story-3",
        chapterNumber: 2,
        title: "Cuoc Goi Tu So La",
        slug: "cuoc-goi-tu-so-la",
        content:
          "Dien thoai do chuong luc 2 gio sang, ben kia chi co tieng gio hut qua duong ham.",
        isPublished: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
  },
  {
    id: "story-4",
    title: "Mua He Nam Ay",
    slug: "mua-he-nam-ay",
    summary:
      "Ky uc hoc duong va moi tinh dau tro lai khi nhom ban cu tai ngo sau nhieu nam.",
    coverUrl: null,
    status: "published",
    isFeatured: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    tags: [{ id: "tag-5", name: "Hoc Duong", slug: "hoc-duong" }],
    chapters: [
      {
        id: "chapter-5",
        storyId: "story-4",
        chapterNumber: 1,
        title: "Thu Bay Tro Gio",
        slug: "thu-bay-tro-gio",
        content:
          "Ngay tro lai truong cu, co ay bat gap mot anh mat quen thuoc tu nhung nam cap ba.",
        isPublished: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "chapter-5b",
        storyId: "story-4",
        chapterNumber: 2,
        title: "Tin Nhan Chua Doc",
        slug: "tin-nhan-chua-doc",
        content:
          "Mot tin nhan da luu 8 nam duoc mo lai, keo theo bi mat cua nhom ban nam xua.",
        isPublished: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
  },
  {
    id: "story-5",
    title: "Bong Dem Sau Nha Hat",
    slug: "bong-dem-sau-nha-hat",
    summary:
      "Mot vu mat tich bi an keo theo chuoi su kien rung ron giua trung tam thanh pho.",
    coverUrl: null,
    status: "published",
    isFeatured: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    tags: [{ id: "tag-6", name: "Kinh Di", slug: "kinh-di" }],
    chapters: [
      {
        id: "chapter-6",
        storyId: "story-5",
        chapterNumber: 1,
        title: "Tieng Dan Luc Nua Dem",
        slug: "tieng-dan-luc-nua-dem",
        content:
          "Sau man bieu dien cuoi cung, nha hat tat den nhung tieng dan van vang len tu phong tap.",
        isPublished: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "chapter-7",
        storyId: "story-5",
        chapterNumber: 2,
        title: "Canh Cua Khoa Ben Trong",
        slug: "canh-cua-khoa-ben-trong",
        content:
          "Bao ve phat hien canh cua phong kho bi khoa tu ben trong du khong co ai trong do.",
        isPublished: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
  },
];

export function flattenChapters(stories: StoryWithChapters[]): Chapter[] {
  return stories.flatMap((story) => story.chapters);
}
