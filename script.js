document.addEventListener("DOMContentLoaded", () => {
  // 1. 무한 라이브 스냅 자동 슬라이더 (모바일 맞춤형 계산 및 애니메이션 주입)
  const trackLeft = document.getElementById("trackLeft");
  const trackRight = document.getElementById("trackRight");

  function initInfiniteScroll(track, direction = 'left', duration = 40) {
    if (!track) return;

    // A. 복제 로직 (딱 1세트만 뒤에 붙입니다)
    if (track.getAttribute("data-cloned") !== "true") {
      const originalContent = Array.from(track.children);
      originalContent.forEach((item) => {
        const clone = item.cloneNode(true);
        track.appendChild(clone);
      });
      track.setAttribute("data-cloned", "true");
    }

    // B. 모바일(너비 768px 이하)일 때만 자바스크립트로 애니메이션 제어
    function setMobileAnimation() {
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // 1) 전체 트랙 너비 계산 (복제본 포함)
        const totalWidth = track.scrollWidth;
        const halfWidth = totalWidth / 2; // 이동해야 할 거리

        // 2) 고유한 애니메이션 이름 생성
        const animName = `jsAnim_${track.id}`;

        // 3) CSS Keyframes 동적 생성
        const styleSheet = document.createElement("style");
        styleSheet.id = `style_${track.id}`;

        // 이미 생성된 스타일이 있다면 제거 후 재생성
        const existingStyle = document.getElementById(styleSheet.id);
        if(existingStyle) existingStyle.remove();

        const keyframes = direction === 'left' 
          ? `@keyframes ${animName} { 0% { transform: translateX(0); } 100% { transform: translateX(${-halfWidth}px); } }`
          : `@keyframes ${animName} { 0% { transform: translateX(${-halfWidth}px); } 100% { transform: translateX(0); } }`;

        styleSheet.textContent = keyframes;
        document.head.appendChild(styleSheet);

        // 4) 계산된 부드러운 애니메이션을 트랙에 적용
        track.style.animation = `${animName} ${duration}s linear infinite`;
        track.style.willChange = 'transform';
      } else {
        // PC 화면에서는 자바스크립트 애니메이션을 끕니다 (style.css 기본 애니메이션 사용)
        track.style.animation = '';
        track.style.willChange = '';
        const existingStyle = document.getElementById(`style_${track.id}`);
        if(existingStyle) existingStyle.remove();
      }
    }

    // 초기 실행 및 화면 크기 변경 시 재계산
    setMobileAnimation();
    window.addEventListener('resize', setMobileAnimation);
  }

  // 트랙 ID, 방향('left'/'right'), 속도(초, 작을수록 빠름)
  initInfiniteScroll(trackLeft, 'left', 45);  
  initInfiniteScroll(trackRight, 'right', 55); 


  // 2. 우측 하단 플로팅 챗봇 & 퀵버튼 메뉴 토글 (기존 코드와 동일)
  const btnQuickToggle = document.getElementById("btnQuickToggle");
  const quickPopupMenu = document.getElementById("quickPopupMenu");

  if (btnQuickToggle && quickPopupMenu) {
    btnQuickToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      quickPopupMenu.classList.toggle("active");
      btnQuickToggle.classList.toggle("is-open");
      const iconSpan = btnQuickToggle.querySelector(".main-icon");
      if (quickPopupMenu.classList.contains("active")) {
        if(iconSpan) iconSpan.textContent = "✖";
      } else {
        if(iconSpan) iconSpan.textContent = "💬";
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