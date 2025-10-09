// COMMUNITY PAGE INTERACTIONS
document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.querySelector(".btn-share");
  const followBtns = document.querySelectorAll(".btn-follow");

  // === Create the share recipe modal ===
  function openShareModal() {
    if (document.querySelector(".custom-modal")) return;

    const modal = document.createElement("div");
    modal.className = "custom-modal";
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h5>Create Recipe Post</h5>
          <button class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <textarea class="form-control mb-2" rows="4" placeholder="Share your recipe or cooking story..."></textarea>
          <div class="d-flex justify-content-between align-items-center">
            <label for="file-upload" class="btn btn-sm btn-secondary">📸 Add Photo</label>
            <input type="file" id="file-upload" accept="image/*" capture="environment" style="display:none">
            <button class="btn btn-primary btn-post">Post</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector(".btn-close").onclick = closeModal;
    modal.querySelector(".modal-backdrop").onclick = closeModal;

    modal.querySelector(".btn-post").onclick = () => {
      alert("✅ Your recipe post has been shared successfully!");
      closeModal();
    };
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", openShareModal);
  }

  // === Follow button toggle ===
  followBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const isFollowing = btn.classList.toggle("following");
      btn.textContent = isFollowing ? "Following ✓" : "Follow";
    });
  });
});
