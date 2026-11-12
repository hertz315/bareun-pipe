
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
        const toggle = $(".gallery-toggle", controls);
        const preference = matchMedia("(prefers-reduced-motion: reduce)");
        const dialog = $("#photo-viewer");
        let paused = false, hovered = false, focused = false, visible = false;
        let frame = 0, last = 0, direction = 1, position = gallery.scrollLeft;
        const allowed = () => !paused && !hovered && !focused && visible &&
          !preference.matches && !document.hidden && !(dialog && dialog.open);
        function tick(now) {
          frame = 0;
          if (!allowed()) { last = 0; return; }
          const elapsed = last ? Math.min(now - last, 50) : 0;
          last = now;
          const max = Math.max(0, gallery.scrollWidth - gallery.clientWidth);
          // Accumulate fractional pixels so movement works on integer-scroll browsers too.
          position = Math.max(0, Math.min(max, position + direction * elapsed * 0.024));
          gallery.scrollLeft = position;
          if (position >= max) direction = -1;
          if (position <= 0) direction = 1;
          if (max > 0) frame = requestAnimationFrame(tick);
        }
        function sync() {
          if (frame) cancelAnimationFrame(frame);
          frame = 0; last = 0; position = gallery.scrollLeft;
          toggle.disabled = preference.matches;
          toggle.textContent = preference.matches ? "자동 넘김 꺼짐" : paused ? "자동 넘김 재생" : "자동 넘김 일시정지";
          if (allowed()) frame = requestAnimationFrame(tick);
        }
        function pause() { paused = true; sync(); }
        controls.hidden = false;
        toggle.addEventListener("click", () => { paused = !paused; sync(); });
        function move(direction) {
          pause();
          const slide = $(".field-slide", gallery);
          if (slide) gallery.scrollBy({ left: direction * (slide.getBoundingClientRect().width + (parseFloat(getComputedStyle(gallery).columnGap) || 0)), behavior: preference.matches ? "auto" : "smooth" });
        }
        controls.addEventListener("click", event => {
          const button = event.target.closest("[data-gallery-step]");
          if (button) move(Number(button.dataset.galleryStep));
        });
        gallery.addEventListener("keydown", event => {
          if (event.target !== gallery || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
          event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1);
        });
        gallery.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") { hovered = true; sync(); } });
        gallery.addEventListener("pointerleave", () => { hovered = false; sync(); });
        gallery.addEventListener("pointerdown", pause);
        gallery.addEventListener("wheel", pause, { passive: true });
        gallery.addEventListener("focusin", () => { focused = true; sync(); });
        gallery.addEventListener("focusout", event => { if (!gallery.contains(event.relatedTarget)) { focused = false; sync(); } });
        document.addEventListener("visibilitychange", sync);
        preference.addEventListener("change", sync);
        if (dialog) new MutationObserver(sync).observe(dialog, { attributes: true, attributeFilter: ["open"] });
        if ("IntersectionObserver" in window) {
          new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(gallery);
        } else { visible = true; }
        window.addEventListener("resize", sync);
        sync();
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
