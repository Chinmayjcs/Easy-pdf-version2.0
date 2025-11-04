// Simple confirmation before submitting
const form = document.querySelector("form");
const fileInput = document.querySelector("input[type='file'][name='pdfs']");
const listEl = document.getElementById("fileList");

// Holds files in the exact order the user wants
let selectedFiles = [];

function renderList() {
  if (!listEl) return;
  listEl.innerHTML = "";
  selectedFiles.forEach((f, idx) => {
    const li = document.createElement("li");
    li.className = "file-item";
    li.innerHTML = `
      <span class="file-name">${f.name}</span>
      <span class="controls">
        <button type="button" class="btn-move" data-dir="up" data-idx="${idx}">▲</button>
        <button type="button" class="btn-move" data-dir="down" data-idx="${idx}">▼</button>
        <button type="button" class="btn-remove" data-idx="${idx}">✕</button>
      </span>
    `;
    listEl.appendChild(li);
  });
}

// When user selects files, capture them as an ordered array
fileInput.addEventListener("change", (e) => {
  // Overwrite the current list with the new selection
  selectedFiles = Array.from(e.target.files || []);
  renderList();
});

// Delegate click handling for move/remove buttons
listEl?.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.classList.contains("btn-move")) {
    const idx = Number(target.getAttribute("data-idx"));
    const dir = target.getAttribute("data-dir");
    if (Number.isNaN(idx) || !dir) return;

    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= selectedFiles.length) return;
    const tmp = selectedFiles[idx];
    selectedFiles[idx] = selectedFiles[newIdx];
    selectedFiles[newIdx] = tmp;
    renderList();
  }

  if (target.classList.contains("btn-remove")) {
    const idx = Number(target.getAttribute("data-idx"));
    if (Number.isNaN(idx)) return;
    selectedFiles.splice(idx, 1);
    renderList();
  }
});

// Submit using fetch so we can control file order in FormData
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedFiles.length) {
    alert("Please choose at least one PDF.");
    return;
  }
  try {
    alert("Merging your PDFs... Please wait!");
    const fd = new FormData();
    selectedFiles.forEach((file) => fd.append("pdfs", file, file.name));

    const resp = await fetch("/merge", { method: "POST", body: fd });
    if (!resp.ok) throw new Error("Merge failed");

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Try to parse filename from header; fallback
    const cd = resp.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename\*=UTF-8''([^;\n\r]+)/) || cd.match(/filename="?([^";\n\r]+)"?/);
    a.download = match?.[1] ? decodeURIComponent(match[1]) : `merged_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Error merging PDFs. Please try again.");
  }
});
