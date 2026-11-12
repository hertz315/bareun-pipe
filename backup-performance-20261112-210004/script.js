
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
        const process = $("#process-photos");
        const processControls = $(".process-controls");
        function move(rail, direction) {
          const slide = $(".field-slide", rail);
          if (slide) rail.scrollBy({ left: direction * (slide.getBoundingClientRect().width + (parseFloat(getComputedStyle(rail).columnGap) || 0)), behavior: reducedMotion() ? "auto" : "smooth" });
        }
        if (process && processControls) {
          processControls.hidden = false;
          processControls.addEventListener("click", event => {
            const button = event.target.closest("[data-process-step]");
            if (button) move(process, Number(button.dataset.processStep));
          });
          process.addEventListener("keydown", event => {
            if (event.target !== process || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
            event.preventDefault(); move(process, event.key === "ArrowRight" ? 1 : -1);
          });
        }
        const group = $(".site-records");
        if (!group) return;
        const toggle = $(".gallery-toggle", group);
        const preference = matchMedia("(prefers-reduced-motion: reduce)");
        const dialog = $("#photo-viewer");
        let paused = false, hovered = false, focused = false, frame = 0, last = 0;
        const rows = $$(".record-row", group).map((rail, index) => {
          if (index === 1) rail.scrollLeft = rail.scrollWidth - rail.clientWidth;
          return { rail, direction: index === 0 ? 1 : -1, position: rail.scrollLeft, visible: false };
        });
        const allowed = () => !paused && !hovered && !focused && !preference.matches && !document.hidden && !(dialog && dialog.open);
        function tick(now) {
          frame = 0;
          if (!allowed()) { last = 0; return; }
          const elapsed = last ? Math.min(now - last, 50) : 0; last = now;
          let moving = false;
          rows.forEach(row => {
            if (!row.visible) return;
            const max = Math.max(0, row.rail.scrollWidth - row.rail.clientWidth);
            row.position = Math.max(0, Math.min(max, row.position + row.direction * elapsed * 0.024));
            row.rail.scrollLeft = row.position;
            if (row.position >= max) row.direction = -1;
            if (row.position <= 0) row.direction = 1;
            moving = moving || max > 0;
          });
          if (moving) frame = requestAnimationFrame(tick);
        }
        function sync() {
          if (frame) cancelAnimationFrame(frame);
          frame = 0; last = 0;
          rows.forEach(row => { row.position = row.rail.scrollLeft; });
          toggle.disabled = preference.matches;
          toggle.textContent = preference.matches ? "자동 넘김 꺼짐" : paused ? "사진 흐름 재생" : "사진 흐름 일시정지";
          if (allowed() && rows.some(row => row.visible)) frame = requestAnimationFrame(tick);
        }
        function pause() { paused = true; sync(); }
        toggle.hidden = false;
        toggle.addEventListener("click", () => { paused = !paused; sync(); });
        rows.forEach(row => {
          const rail = row.rail;
          rail.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") { hovered = true; sync(); } });
          rail.addEventListener("pointerleave", () => { hovered = false; sync(); });
          rail.addEventListener("pointerdown", pause);
          rail.addEventListener("wheel", pause, { passive: true });
          rail.addEventListener("focusin", () => { focused = true; sync(); });
          rail.addEventListener("focusout", event => { if (!rail.contains(event.relatedTarget)) { focused = false; sync(); } });
          rail.addEventListener("keydown", event => {
            if (event.target !== rail || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
            event.preventDefault(); pause(); move(rail, event.key === "ArrowRight" ? 1 : -1);
          });
          if ("IntersectionObserver" in window) {
            new IntersectionObserver(entries => { row.visible = entries[0].isIntersecting; sync(); }).observe(rail);
          } else row.visible = true;
        });
        document.addEventListener("visibilitychange", sync);
        preference.addEventListener("change", sync);
        if (dialog) new MutationObserver(sync).observe(dialog, { attributes: true, attributeFilter: ["open"] });
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
