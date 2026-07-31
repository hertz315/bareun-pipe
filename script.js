document.addEventListener("DOMContentLoaded", () => {
  // 1. 무한 라이브 스냅 자동 슬라이더 (복제 횟수 최적화 및 중복 방지)
  const trackLeft = document.getElementById("trackLeft");
  const trackRight = document.getElementById("trackRight");

  function initInfiniteScroll(track) {
    if (!track) return;
    
    // 이미 무한 스크롤용 복제가 진행되었다면 중단
    if (track.getAttribute("data-cloned") === "true") return;

    const originalContent = Array.from(track.children);
    // 무한 루프 연결을 위해 딱 1 세트만 뒤에 복제해 붙입니다.
    originalContent.forEach((item) => {
      const clone = item.cloneNode(true);
      track.appendChild(clone);
    });

    track.setAttribute("data-cloned", "true");
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