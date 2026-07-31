document.addEventListener("DOMContentLoaded", () => {
  // 1. 무한 라이브 스냅 자동 슬라이더
  const trackLeft = document.getElementById("trackLeft");
  const trackRight = document.getElementById("trackRight");

  function initInfiniteScroll(track) {
    if (!track) return;
    const originalContent = Array.from(track.children);
    for (let i = 0; i < 3; i++) {
      originalContent.forEach((item) => {
        const clone = item.cloneNode(true);
        track.appendChild(clone);
      });
    }
  }

  initInfiniteScroll(trackLeft);
  initInfiniteScroll(trackRight);

  // 2. 우측 하단 플로팅 챗봇 & 퀵버튼 메뉴 토글
  const btnQuickToggle = document.getElementById("btnQuickToggle");
  const quickPopupMenu = document.getElementById("quickPopupMenu");

  if (btnQuickToggle && quickPopupMenu) {
    btnQuickToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      
      quickPopupMenu.classList.toggle("active");
      btnQuickToggle.classList.toggle("is-open");

      const iconSpan = btnQuickToggle.querySelector(".main-icon");
      if (quickPopupMenu.classList.contains("active")) {
        iconSpan.textContent = "✖";
      } else {
        iconSpan.textContent = "💬";
      }
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".floating-quick-menu")) {
        quickPopupMenu.classList.remove("active");
        btnQuickToggle.classList.remove("is-open");
        const iconSpan = btnQuickToggle.querySelector(".main-icon");
        if (iconSpan) iconSpan.textContent = "💬";
      }
    });
  }
});