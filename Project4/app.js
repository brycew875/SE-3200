const API_URL = "http://127.0.0.1:8000/landmarks";

let allLandmarks = [];
let editingLandmarkId = null;

// DOM Elements
const statusBanner = document.getElementById("status-banner");
const formSection = document.getElementById("form-section");
const formHeading = document.getElementById("form-heading");
const landmarkForm = document.getElementById("landmark-form");
const submitBtn = document.getElementById("submit-btn");
const landmarksList = document.getElementById("landmarks-list");
const recordCount = document.getElementById("record-count");
const searchInput = document.getElementById("search-input");

// Form Inputs
const idInput = document.getElementById("landmark-id");
const nameInput = document.getElementById("name");
const navajoNameInput = document.getElementById("navajo_name");
const regionInput = document.getElementById("region");
const categoryInput = document.getElementById("category");
const elevationInput = document.getElementById("elevation_ft");
const descriptionInput = document.getElementById("description");

// Modal Elements
const detailModal = document.getElementById("detail-modal");

function showStatus(message, type = "success") {
  statusBanner.textContent = message;
  statusBanner.className = `status-banner ${type}`;
  clearTimeout(showStatus._timer);
  showStatus._timer = setTimeout(() => {
    statusBanner.classList.add("hidden");
  }, 4500);
}

// --- API Requests (Ajax via fetch) ---

async function fetchLandmarks() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to load landmarks (HTTP ${response.status})`);
    }
    allLandmarks = await response.json();
    renderLandmarks();
  } catch (error) {
    recordCount.textContent = "Unable to connect to the API server.";
    showStatus(`Error loading data: ${error.message}`, "error");
  }
}

async function fetchSingleLandmark(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Landmark not found.");
    }
    openDetailModal(data);
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function createLandmark(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to create landmark.");
  }
  return data;
}

async function updateLandmark(id, payload) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to update landmark.");
  }
  return data;
}

async function deleteLandmark(id, name) {
  const confirmed = window.confirm(
    `Are you sure you want to remove "${name}" from the Navajo Nation Landmarks registry?`
  );
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete landmark.");
    }
    if (editingLandmarkId === id) {
      resetAndHideForm();
    }
    showStatus(`Deleted "${name}".`, "success");
    await fetchLandmarks();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

// --- UI Rendering & Transitions ---

function renderLandmarks() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = allLandmarks.filter((item) => {
    return (
      item.name.toLowerCase().includes(query) ||
      item.navajo_name.toLowerCase().includes(query) ||
      item.region.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  recordCount.textContent = `Showing ${filtered.length} of ${allLandmarks.length} landmarks`;
  landmarksList.innerHTML = "";

  if (filtered.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.className = "muted-text";
    emptyMsg.textContent = "No landmarks match your current view.";
    landmarksList.appendChild(emptyMsg);
    return;
  }

  filtered.forEach((landmark) => {
    const card = document.createElement("article");
    card.className = "landmark-card";

    card.innerHTML = `
      <div>
        <div class="card-top">
          <span class="badge badge-turquoise">${escapeHtml(landmark.category)}</span>
          <span class="elevation-tag" title="Elevation">
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
              <path d="M2 16L8 6l4 6 3-4 3 8H2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>
            ${Number(landmark.elevation_ft).toLocaleString()} ft
          </span>
        </div>
        <h3>${escapeHtml(landmark.name)}</h3>
        <p class="dine-subtitle">${escapeHtml(landmark.navajo_name)}</p>
        <div class="meta-row">
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
            <path d="M10 2a6 6 0 0 0-6 6c0 4.5 6 10 6 10s6-5.5 6-10a6 6 0 0 0-6-6zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
          </svg>
          <span>${escapeHtml(landmark.region)}</span>
        </div>
        <p class="card-description">${escapeHtml(landmark.description)}</p>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn-ghost btn-sm inspect-btn">Details</button>
        <button type="button" class="btn btn-secondary btn-sm edit-btn">Edit</button>
        <button type="button" class="btn btn-danger btn-sm delete-btn">Delete</button>
      </div>
    `;

    card.querySelector(".inspect-btn").addEventListener("click", () => {
      fetchSingleLandmark(landmark.id);
    });

    card.querySelector(".edit-btn").addEventListener("click", () => {
      openEditForm(landmark);
    });

    card.querySelector(".delete-btn").addEventListener("click", () => {
      deleteLandmark(landmark.id, landmark.name);
    });

    landmarksList.appendChild(card);
  });
}

function openCreateForm() {
  editingLandmarkId = null;
  landmarkForm.reset();
  idInput.value = "";
  formHeading.textContent = "Add New Landmark";
  submitBtn.textContent = "Create Landmark";
  formSection.classList.remove("hidden");
  nameInput.focus();
}

function openEditForm(landmark) {
  editingLandmarkId = landmark.id;
  idInput.value = landmark.id;
  nameInput.value = landmark.name;
  navajoNameInput.value = landmark.navajo_name;
  regionInput.value = landmark.region;
  categoryInput.value = landmark.category;
  elevationInput.value = landmark.elevation_ft;
  descriptionInput.value = landmark.description;

  formHeading.textContent = `Edit Landmark: ${landmark.name}`;
  submitBtn.textContent = "Update Landmark";
  formSection.classList.remove("hidden");
  formSection.scrollIntoView({ behavior: "smooth" });
}

function resetAndHideForm() {
  editingLandmarkId = null;
  landmarkForm.reset();
  idInput.value = "";
  formSection.classList.add("hidden");
}

function openDetailModal(landmark) {
  document.getElementById("modal-category").textContent = landmark.category;
  document.getElementById("modal-title").textContent = landmark.name;
  document.getElementById("modal-navajo-name").textContent = landmark.navajo_name;
  document.getElementById("modal-region").textContent = landmark.region;
  document.getElementById("modal-elevation").textContent = `${Number(landmark.elevation_ft).toLocaleString()} ft`;
  document.getElementById("modal-description").textContent = landmark.description;
  detailModal.classList.remove("hidden");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

// --- Event Listeners ---

document.getElementById("open-create-btn").addEventListener("click", openCreateForm);
document.getElementById("close-form-btn").addEventListener("click", resetAndHideForm);
document.getElementById("cancel-form-btn").addEventListener("click", resetAndHideForm);
searchInput.addEventListener("input", renderLandmarks);

document.getElementById("close-modal-btn").addEventListener("click", () => {
  detailModal.classList.add("hidden");
});

detailModal.addEventListener("click", (event) => {
  if (event.target === detailModal) {
    detailModal.classList.add("hidden");
  }
});

landmarkForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    name: nameInput.value.trim(),
    navajo_name: navajoNameInput.value.trim(),
    region: regionInput.value,
    category: categoryInput.value,
    elevation_ft: parseInt(elevationInput.value, 10),
    description: descriptionInput.value.trim(),
  };

  try {
    if (editingLandmarkId !== null) {
      await updateLandmark(editingLandmarkId, payload);
      showStatus(`Updated "${payload.name}" successfully.`, "success");
    } else {
      await createLandmark(payload);
      showStatus(`Added "${payload.name}" to the registry.`, "success");
    }
    resetAndHideForm();
    await fetchLandmarks();
  } catch (error) {
    showStatus(error.message, "error");
  }
});

// Initial load
fetchLandmarks();
