// COMMUNITY PAGE INTERACTIONS
document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.querySelector(".btn-share");
  const followBtns = document.querySelectorAll(".btn-follow");
  const communityContainer = document.querySelector(".community-container");

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

    // === Handle post creation ===
    modal.querySelector(".btn-post").onclick = () => {
      const text = modal.querySelector("textarea").value.trim();
      if (!text) {
        alert("Please write something before posting!");
        return;
      }

      // Create a new post card element
      const newPost = document.createElement("section");
      newPost.className = "recipe-card shadow-sm";
      newPost.innerHTML = `
        <div class="d-flex align-items-center mb-2">
          <div class="avatar">YOU</div>
          <div class="ms-2">
            <strong>You</strong>
            <p class="small text-muted mb-0">Just now</p>
          </div>
        </div>
        <p>${text}</p>
        <div class="d-flex justify-content-end">
          <button class="btn btn-sm btn-follow">Follow</button>
        </div>
      `;

      // Insert the new post at the top (after filters)
      const firstCard = document.querySelector(".recipe-card");
      communityContainer.insertBefore(newPost, firstCard);

      closeModal();
    };
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", openShareModal);
  }

  // === Follow button toggle ===
  function attachFollowToggle(btn) {
    btn.addEventListener("click", () => {
      const isFollowing = btn.classList.toggle("following");
      btn.textContent = isFollowing ? "Following ✓" : "Follow";
    });
  }

  followBtns.forEach(attachFollowToggle);

  // Reuse this later for dynamically created posts too
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-follow")) {
      attachFollowToggle(e.target);
    }
  });
});
