document.addEventListener("DOMContentLoaded", () => {
  // 1. 무한 라이브 스냅 자동 슬라이더 (안정적인 복제 전용)
  function initInfiniteScroll(track) {
    if (!track) return;
    
    // 이미 복제가 완료되었다면 중단
    if (track.getAttribute("data-cloned") === "true") return;

    const originalContent = Array.from(track.children);
    // 무한 루프 연결을 위해 딱 1세트만 뒤에 복제해 붙입니다.
    originalContent.forEach((item) => {
      const clone = item.cloneNode(true);
      track.appendChild(clone);
    });

    // 복제 완료 속성 추가 -> CSS 애니메이션 트리거
    track.setAttribute("data-cloned", "true");
  }

  const trackLeft = document.getElementById("trackLeft");
  const trackRight = document.getElementById("trackRight");

  // 무조건 안정적으로 복제 실행
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
        if (iconSpan) iconSpan.textContent = "✖";
      } else {
        if (iconSpan) iconSpan.textContent = "💬";
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