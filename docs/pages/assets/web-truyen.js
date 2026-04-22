const STORAGE_KEY = "bipbip_pages_stories";

function readStories() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function renderCategoryFilter(stories) {
  const select = document.getElementById("categoryFilter");
  const categories = [...new Set(stories.map((s) => s.category).filter(Boolean))].sort();
  select.innerHTML =
    `<option value="">Lọc theo danh mục (Tất cả)</option>` +
    categories.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function renderStories() {
  const stories = readStories();
  renderCategoryFilter(stories);

  const root = document.getElementById("storyList");
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;

  const filtered = stories.filter((s) => {
    const inCategory = !category || s.category === category;
    const text = `${s.title} ${s.author} ${s.tags} ${s.summary}`.toLowerCase();
    const inSearch = !search || text.includes(search);
    return inCategory && inSearch;
  });

  if (!filtered.length) {
    root.innerHTML = '<article class="item muted">Không có dữ liệu phù hợp.</article>';
    return;
  }

  root.innerHTML = filtered
    .map(
      (s) => `
      <article class="item">
        <h3>${s.title}</h3>
        <p class="muted">${s.author || "Không rõ tác giả"} · ${s.category || "Chưa có danh mục"}</p>
        <p>${s.summary}</p>
        <p class="muted">Thể loại: ${s.tags || "—"} · Trạng thái: ${s.status || "ongoing"} · Tổng chương: ${s.totalChapters || "—"}</p>
      </article>
    `,
    )
    .join("");
}

document.getElementById("searchInput").addEventListener("input", renderStories);
document.getElementById("categoryFilter").addEventListener("change", renderStories);
renderStories();
