
    "use strict";
    (() => {
      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
      const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

      function initImageFallbacks() {
        $$(".photo img, .hero-image").forEach(image => {
          const mark = () => {
            if (image.matches(".hero-image")) image.hidden = true;
            else image.parentElement.classList.add("is-unavailable");
          };
          image.addEventListener("error", mark);
          image.addEventListener("load", () => image.parentElement.classList.remove("is-unavailable"));
          if (image.complete && image.naturalWidth === 0) mark();
        });
      }

      function initGallery() {
        const gallery = $(".field-gallery");
        const controls = $(".field-controls");
        if (!gallery || !controls) return;
        const slides = $$(".field-slide", gallery);
        const filters = $(".work-filters");
        const status = $(".gallery-status");
        controls.hidden = false;
        const move = direction => {
          const slide = slides.find(item => !item.hidden);
          if (!slide) return;
          const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
          gallery.scrollBy({ left: direction * (slide.getBoundingClientRect().width + gap), behavior: reducedMotion() ? "auto" : "smooth" });
        };
        controls.addEventListener("click", event => {
          const button = event.target.closest("[data-gallery-step]");
          if (button) move(Number(button.dataset.galleryStep));
        });
        gallery.addEventListener("keydown", event => {
          if (event.target !== gallery || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        });
        if (!filters) return;
        filters.hidden = false;
        filters.addEventListener("click", event => {
          const button = event.target.closest("[data-filter]");
          if (!button) return;
          const selected = button.dataset.filter;
          $$("[data-filter]", filters).forEach(item => item.setAttribute("aria-pressed", String(item === button)));
          slides.forEach(slide => { slide.hidden = selected !== "all" && slide.dataset.category !== selected; });
          gallery.scrollLeft = 0;
          if (status) status.textContent = `${button.textContent} · 사진 ${slides.filter(slide => !slide.hidden).length}장`;
        });
        if (status) status.textContent = `전체 · 사진 ${slides.length}장`;
      }

      function initPhotoViewer() {
        const dialog = $("#photo-viewer");
        const cases = $("#cases");
        if (!cases || !dialog || typeof dialog.showModal !== "function") return;
        const image = $("#viewer-image", dialog);
        const message = $(".viewer-status", dialog);
        const description = $("#viewer-description", dialog);
        const count = $(".viewer-count", dialog);
        const buttons = $$("[data-viewer-step]", dialog);
        let links = [];
        let index = 0;
        let opener = null;
        let request = 0;

        function renderPhoto() {
          const link = links[index];
          if (!link) return;
          const token = ++request;
          const thumbnail = $("img", link);
          const figure = link.closest("figure");
          const caption = figure && $("figcaption", figure);
          description.textContent = caption ? caption.textContent.trim().replace(/\s+/g, " ") : thumbnail.alt;
          count.textContent = `${index + 1} / ${links.length}`;
          buttons.forEach(button => { button.disabled = links.length < 2; });
          image.hidden = true;
          image.removeAttribute("src");
          message.hidden = false;
          message.textContent = "사진을 불러오는 중입니다.";
          // Load only the selected full-size image; ignore stale loads after rapid navigation.
          const loader = new Image();
          loader.onload = () => {
            if (request !== token || !dialog.open) return;
            image.alt = thumbnail.alt || "현장 사진";
            image.src = link.href;
            image.hidden = false;
            message.hidden = true;
          };
          loader.onerror = () => {
            if (request !== token || !dialog.open) return;
            message.textContent = "사진을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.";
          };
          loader.src = link.href;
        }
        function move(direction) {
          index = (index + direction + links.length) % links.length;
          renderPhoto();
        }
        cases.addEventListener("click", event => {
          const link = event.target.closest("a[href]");
          if (!link || !cases.contains(link) || !$(".photo img", link)) return;
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute("download")) return;
          const group = link.closest(".field-gallery, .photo-grid");
          links = group ? $$("a[href]", group).filter(item => $(".photo img", item) && item.getClientRects().length > 0) : [link];
          index = links.indexOf(link);
          if (index < 0) return;
          event.preventDefault();
          opener = link;
          dialog.showModal();
          document.documentElement.classList.add("photo-viewer-open");
          renderPhoto();
        });
        $("[data-viewer-close]", dialog).addEventListener("click", () => dialog.close());
        buttons.forEach(button => button.addEventListener("click", () => move(Number(button.dataset.viewerStep))));
        dialog.addEventListener("keydown", event => {
          if (!["ArrowLeft", "ArrowRight"].includes(event.key) || links.length < 2) return;
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        });
        dialog.addEventListener("click", event => {
          if (event.target !== dialog) return;
          const rect = dialog.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
        });
        dialog.addEventListener("close", () => {
          request++;
          image.hidden = true;
          image.removeAttribute("src");
          document.documentElement.classList.remove("photo-viewer-open");
          if (opener && opener.isConnected) opener.focus({ preventScroll: true });
        });
      }

      initImageFallbacks();
      initGallery();
      initPhotoViewer();
    })();
