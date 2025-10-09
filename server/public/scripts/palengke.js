// PALENGKE PAGE INTERACTIONS
document.addEventListener("DOMContentLoaded", () => {
  // Remove unneeded filter buttons
  document.querySelectorAll(".btn-filter").forEach(btn => {
    const text = btn.textContent.trim().toLowerCase();
    if (text === "vegetables" || text.includes("meat")) btn.remove();
  });

  const viewButtons = document.querySelectorAll(".btn-view");
  const callButtons = document.querySelectorAll(".btn-call");

  // === Create market details modal ===
  function openMarketModal(title, info) {
    if (document.querySelector(".market-modal")) return;

    const modal = document.createElement("div");
    modal.className = "market-modal";
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h5>${title}</h5>
          <button class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>${info}</p>
          <p>🛍️ Products: Fresh produce, meats, local goods.</p>
          <p>📍 Address: Barangay Central Area, Your City</p>
          <p>🕔 Usually open: 5:00 AM – 6:00 PM</p>
          <p>💬 “Known for friendly vendors and affordable prices.”</p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector(".btn-close").onclick = closeModal;
    modal.querySelector(".modal-backdrop").onclick = closeModal;
  }

  // === View Details click ===
  viewButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".market-card");
      const name = card.querySelector("h5")?.textContent || "Market";
      const info = card.querySelector("p")?.textContent || "Details not available";
      openMarketModal(name, info);
    });
  });

  // === Call Now click ===
  callButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".market-card");
      const text = card.textContent;
      const phone = text.match(/(09\d{9}|\(\d{2}\)\s?\d{3}-\d{4})/);
      if (phone) {
        window.location.href = `tel:${phone[0].replace(/\D/g, "")}`;
      } else {
        alert("☎️ No phone number found for this market.");
      }
    });
  });
});
