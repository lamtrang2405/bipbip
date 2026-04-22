const STORAGE_KEY = "bipbip_pages_stories";

function readStories() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeStories(stories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function renderStories() {
  const root = document.getElementById("cmsStoryList");
  const stories = readStories();

  if (!stories.length) {
    root.innerHTML = '<div class="item muted">Chưa có truyện nào.</div>';
    return;
  }

  root.innerHTML = stories
    .map(
      (story) => `
      <article class="item">
        <h3>${story.title}</h3>
        <p class="muted">${story.author || "Không rõ tác giả"} · ${story.category || "Chưa có danh mục"}</p>
        <p>${story.summary}</p>
        <p class="muted">Thể loại: ${story.tags || "—"} · Trạng thái: ${story.status} · Tổng chương: ${story.totalChapters || "—"}</p>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="small-btn danger" data-del="${story.id}">Xóa</button>
        </div>
      </article>
    `,
    )
    .join("");

  root.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const next = readStories().filter((s) => s.id !== id);
      writeStories(next);
      renderStories();
    });
  });
}

function renderByCategory() {
  const root = document.getElementById("cmsCategoryList");
  const stories = readStories();
  if (!stories.length) {
    root.innerHTML = '<div class="item muted">Chưa có dữ liệu.</div>';
    return;
  }

  const grouped = stories.reduce((acc, s) => {
    const key = s.category || "Chưa có danh mục";
    acc[key] = acc[key] || [];
    acc[key].push(s);
    return acc;
  }, {});

  const blocks = Object.keys(grouped)
    .sort()
    .map((cat) => {
      const items = grouped[cat]
        .map((s) => `<li>${s.title} · ${s.author || "—"} · ${s.totalChapters || "—"} chương</li>`)
        .join("");
      return `
        <article class="item">
          <h3>${cat}</h3>
          <ul>${items}</ul>
        </article>
      `;
    });
  root.innerHTML = blocks.join("");
}

function initTabs() {
  const tabs = Array.from(document.querySelectorAll(".cms-tab"));
  const panels = Array.from(document.querySelectorAll(".cms-panel"));
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const key = tab.getAttribute("data-tab");
      if (!key) return;
      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      panels.forEach((p) => {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === key);
      });
    });
  });
}

document.getElementById("storyForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const fd = new FormData(form);
  const title = String(fd.get("title") || "").trim();
  const author = String(fd.get("author") || "").trim();
  const summary = String(fd.get("summary") || "").trim();
  if (!title || !author || !summary) return;

  const stories = readStories();
  stories.unshift({
    id: crypto.randomUUID(),
    title,
    author,
    summary,
    category: String(fd.get("category") || "").trim(),
    tags: String(fd.get("tags") || "").trim(),
    status: String(fd.get("status") || "ongoing"),
    totalChapters: String(fd.get("totalChapters") || "").trim(),
    thumbnail: String(fd.get("thumbnail") || "").trim(),
    slug: slugify(title),
    createdAt: new Date().toISOString(),
  });
  writeStories(stories);
  form.reset();
  renderStories();
  renderByCategory();
});

renderStories();
renderByCategory();
initTabs();
