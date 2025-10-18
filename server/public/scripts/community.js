document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.querySelector(".btn-share");

  // create and show share modal
  function openShareModal(opts = {}) {
    // opts: { mode: 'create'|'edit', recipe: {} }
    const { mode = "create", recipe = null } = opts;

    const modal = document.createElement("div");
    modal.className = "custom-modal";
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h5>${mode === "create" ? "Share a Recipe" : "Edit Recipe"}</h5>
          <button class="btn-close">&times;</button>
        </div>
        <form id="shareForm" enctype="multipart/form-data">
          <textarea name="description" class="form-control mb-2" rows="4" placeholder="Share your recipe...">${recipe ? (recipe.text || '') : ''}</textarea>
          <input type="file" name="image" accept="image/*" class="form-control mb-2">
          <div id="previewContainer">
            ${recipe && recipe.image ? `<img id="preview" src="${recipe.image}" />` : `<img id="preview" style="display:none;" />`}
          </div>
          <div class="d-flex gap-2">
            ${mode === "edit" ? `<button type="button" class="btn btn-outline-danger" id="removeImageBtn">${recipe && recipe.image ? 'Remove Image' : 'No Image'}</button>` : ''}
            <button type="submit" class="btn btn-primary w-100">${mode === "create" ? "Post" : "Save"}</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector(".btn-close").onclick = closeModal;
    modal.querySelector(".modal-backdrop").onclick = closeModal;

    const fileInput = modal.querySelector('input[type="file"]');
    const preview = modal.querySelector("#preview");
    const removeImageBtn = modal.querySelector("#removeImageBtn");
    let removeImageFlag = false;

    // preview image before upload
    fileInput.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) {
        preview.style.display = "none";
        preview.src = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.src = ev.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(f);
      if (removeImageBtn) removeImageBtn.textContent = "Replace Image";
      removeImageFlag = false;
    });

    if (removeImageBtn) {
      removeImageBtn.addEventListener("click", () => {
        // mark to remove image on edit
        removeImageFlag = true;
        preview.src = "";
        preview.style.display = "none";
        fileInput.value = "";
        removeImageBtn.textContent = "Image will be removed";
      });
    }

    modal.querySelector("#shareForm").onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      const fd = new FormData(form);
      // when editing: use PUT /community/edit/:id with method override via fetch
      try {
        if (mode === "create") {
          const res = await fetch("/community/add", { method: "POST", body: fd });
          if (res.ok) location.reload();
          else {
            const err = await res.json().catch(()=>({message:'Error'}));
            alert(err.message || "Error posting recipe");
          }
        } else {
          // edit mode
          if (removeImageFlag) fd.append("removeImage", "true");
          const res = await fetch(`/community/edit/${recipe._id}`, {
            method: "PUT",
            body: fd,
          });
          if (res.ok) location.reload();
          else {
            const err = await res.json().catch(()=>({message:'Error'}));
            alert(err.message || "Error updating recipe");
          }
        }
      } catch (err) {
        console.error(err);
        alert("Network error");
      }
    };
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", () => openShareModal());
  }

  // Delete
  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest(".recipe-card").dataset.id;
      if (!confirm("Delete this post?")) return;
      try {
        const res = await fetch(`/community/delete/${id}`, { method: "DELETE" });
        if (res.ok) location.reload();
        else alert("Failed to delete");
      } catch (err) {
        console.error(err);
        alert("Network error");
      }
    });
  });

  // Edit
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".recipe-card");
      const id = card.dataset.id;
      // gather current fields to prefill modal
      const text = card.querySelector(".post-text") ? card.querySelector(".post-text").textContent : "";
      const imageEl = card.querySelector(".post-image");
      const image = imageEl ? imageEl.getAttribute("src") : null;
      openShareModal({ mode: "edit", recipe: { _id: id, text, image } });
    });
  });

  // Like button (single click)
  document.querySelectorAll(".recipe-card").forEach((card) => {
    const likeBtn = card.querySelector(".btn-like");
    if (!likeBtn) return;
    likeBtn.addEventListener("click", async () => {
      const id = card.dataset.id;
      try {
        const res = await fetch(`/community/like/${id}`, { method: "POST" });
        if (!res.ok) return;
        const data = await res.json();
        card.querySelector(".like-count").textContent = data.likes;
        const emoji = card.querySelector(".like-emoji");
        if (emoji) emoji.textContent = data.liked ? "💖" : "🤍";
      } catch (err) {
        console.error(err);
      }
    });
  });
});
