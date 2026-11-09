/**
 * Diné Art Registry - Front-End Controller
 */

const CONFIG = {
  API_BASE_URL: "http://localhost:8000/api/crafts"
};

// Application State
const state = {
  crafts: [],
  activeCraft: null
};

// DOM References
const elements = {
  listView: document.getElementById("list-view"),
  formView: document.getElementById("form-view"),
  craftGrid: document.getElementById("craft-grid"),
  craftForm: document.getElementById("craft-form"),
  formTitle: document.getElementById("form-title"),
  showCreateBtn: document.getElementById("show-create-btn"),
  cancelFormBtn: document.getElementById("cancel-form-btn"),
  detailPanel: document.getElementById("detail-panel"),
  detailContent: document.getElementById("detail-content"),
  closeDetailBtn: document.getElementById("close-detail-btn"),
  // Form Inputs
  fieldId: document.getElementById("craft-id"),
  fieldTitle: document.getElementById("title"),
  fieldArtist: document.getElementById("artist"),
  fieldCategory: document.getElementById("category"),
  fieldPrice: document.getElementById("price"),
  fieldYear: document.getElementById("year_created")
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  bindEventListeners();
  loadCrafts();
});

function bindEventListeners() {
  elements.showCreateBtn.addEventListener("click", () => renderFormView());
  elements.cancelFormBtn.addEventListener("click", () => renderListView());
  elements.craftForm.addEventListener("submit", handleFormSubmission);
  elements.closeDetailBtn.addEventListener("click", () => elements.detailPanel.classList.add("hidden"));
}

// -----------------------------------------------------------------------------
// NAVIGATION & VIEW SWITCHING
// -----------------------------------------------------------------------------
function renderListView() {
  elements.formView.classList.add("hidden");
  elements.listView.classList.remove("hidden");
  elements.craftForm.reset();
  elements.fieldId.value = "";
}

function renderFormView(craftData = null) {
  if (craftData) {
    elements.formTitle.textContent = "Update Craft Record";
    elements.fieldId.value = craftData.id;
    elements.fieldTitle.value = craftData.title;
    elements.fieldArtist.value = craftData.artist;
    elements.fieldCategory.value = craftData.category;
    elements.fieldPrice.value = craftData.price;
    elements.fieldYear.value = craftData.year_created;
  } else {
    elements.formTitle.textContent = "Register New Craft";
    elements.craftForm.reset();
    elements.fieldId.value = "";
  }

  elements.listView.classList.add("hidden");
  elements.formView.classList.remove("hidden");
}

// -----------------------------------------------------------------------------
// API CLIENT IMPLEMENTATION (AJAX via Async/Await Fetch API)
// -----------------------------------------------------------------------------

// GET: Fetch Collection List
async function loadCrafts() {
  try {
    const response = await fetch(CONFIG.API_BASE_URL);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    state.crafts = await response.json();
    renderCraftGrid(state.crafts);
  } catch (error) {
    console.error("Failed to fetch collection:", error);
    elements.craftGrid.innerHTML = `<p style="color:var(--danger-color);">Failed to load crafts collection. Please check backend API server status.</p>`;
  }
}

// GET: Fetch Single Record Details
async function inspectCraft(id) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/${id}`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const craft = await response.json();
    
    elements.detailContent.innerHTML = `
      <p><strong>Primary Key (ID):</strong> ${craft.id}</p>
      <p><strong>Title:</strong> ${sanitize(craft.title)}</p>
      <p><strong>Artisan:</strong> ${sanitize(craft.artist)}</p>
      <p><strong>Category:</strong> ${sanitize(craft.category)}</p>
      <p><strong>Valuation:</strong> $${Number(craft.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      <p><strong>Year Created:</strong> ${craft.year_created}</p>
    `;
    elements.detailPanel.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    alert(`Could not fetch details: ${error.message}`);
  }
}

// POST / PUT: Save Item Data
async function handleFormSubmission(event) {
  event.preventDefault();

  const id = elements.fieldId.value;
  const payload = {
    title: elements.fieldTitle.value.trim(),
    artist: elements.fieldArtist.value.trim(),
    category: elements.fieldCategory.value,
    price: parseFloat(elements.fieldPrice.value),
    year_created: parseInt(elements.fieldYear.value, 10)
  };

  const isEdit = Boolean(id);
  const endpoint = isEdit ? `${CONFIG.API_BASE_URL}/${id}` : CONFIG.API_BASE_URL;
  const method = isEdit ? "PUT" : "POST";

  try {
    const response = await fetch(endpoint, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errResponse = await response.json();
      throw new Error(errResponse.message || "Failed to save record.");
    }

    renderListView();
    await loadCrafts();
  } catch (error) {
    alert(`Persistence Error: ${error.message}`);
  }
}

// DELETE: Remove Item
async function removeCraft(id, title) {
  const confirmed = confirm(`Are you sure you wish to delete "${title}"? This operation cannot be undone.`);
  if (!confirmed) return;

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    await loadCrafts();
  } catch (error) {
    alert(`Failed to delete craft record: ${error.message}`);
  }
}

// -----------------------------------------------------------------------------
// DOM RENDERING & SANITIZATION
// -----------------------------------------------------------------------------
function renderCraftGrid(items) {
  elements.craftGrid.innerHTML = "";

  if (items.length === 0) {
    elements.craftGrid.innerHTML = "<p>No craft items registered in the database.</p>";
    return;
  }

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div>
        <div class="card-header">
          <span class="badge">${sanitize(item.category)}</span>
        </div>
        <h3 class="card-title">${sanitize(item.title)}</h3>
        <p class="card-subtitle">Artisan: ${sanitize(item.artist)}</p>
      </div>
      <div>
        <div class="card-metrics">
          <span><strong>Value:</strong> $${Number(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          <span><strong>Year:</strong> ${item.year_created}</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-secondary inspect-btn">Inspect</button>
          <button class="btn btn-edit edit-btn">Edit</button>
          <button class="btn btn-danger delete-btn">Delete</button>
        </div>
      </div>
    `;

    card.querySelector(".inspect-btn").addEventListener("click", () => inspectCraft(item.id));
    card.querySelector(".edit-btn").addEventListener("click", () => renderFormView(item));
    card.querySelector(".delete-btn").addEventListener("click", () => removeCraft(item.id, item.title));

    elements.craftGrid.appendChild(card);
  });
}

function sanitize(str) {
  return String(str).replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[match]));
}
