/* ============================================================================
   GeoDev Formal Icons Patch v1.0 (geo-formal-icons.js)
   استبدال كافة الإيموجي بأيقونات Lucide SVG الرسمية الموحدة في كامل المنصة
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOFormalIcons) return;
  window.GEOFormalIcons = true;

  // خريطة استبدال الإيموجي بأيقونات Lucide الهندسية والأكاديمية الرسمية
  const ICON_MAP = {
    "🎓": "graduation-cap",
    "📚": "library",
    "📖": "book-open",
    "🧭": "compass",
    "🌍": "globe-2",
    "🌐": "globe",
    "🔑": "key-round",
    "🤖": "cpu",
    "🔎": "search",
    "🔍": "search",
    "✍️": "pen-tool",
    "📥": "download",
    "🎯": "target",
    "👨‍🏫": "user-check",
    "▶": "play",
    "📦": "package",
    "⚡": "zap",
    "🚀": "terminal",
    "📂": "folder-open",
    "🗂️": "folders",
    "🛠️": "wrench",
    "📋": "copy",
    "🎬": "video",
    "📐": "drafting-compass",
    "🛰️": "satellite",
    "🗺️": "map",
    "🔧": "settings-2",
    "🧠": "brain-circuit",
    "➕": "plus",
    "🌟": "award",
    "📝": "file-text",
    "📊": "bar-chart-3",
    "ℹ️": "info",
    "🎨": "image",
    "⬇️": "download",
    "🖼️": "image",
    "💾": "save",
    "✅": "check-circle-2",
    "⚠️": "alert-triangle",
    "❌": "x-circle",
    "⏳": "loader-2",
    "✨": "sparkles",
    "➤": "arrow-left"
  };

  // بناء تعبير نمطي يلتقط أي إيموجي من القائمة
  const escapedKeys = Object.keys(ICON_MAP)
    .sort((a, b) => b.length - a.length)
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const EMOJI_REGEX = new RegExp(`(${escapedKeys.join("|")})`, "g");

  function injectFormalIconCSS() {
    if (document.getElementById("geoFormalIconCSS")) return;
    const st = document.createElement("style");
    st.id = "geoFormalIconCSS";
    st.textContent = `
      .gd-formal-ic {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: -0.18em;
        margin-inline-end: 6px;
        color: currentColor;
        flex-shrink: 0;
      }
      .gd-formal-ic svg {
        width: 1.08em;
        height: 1.08em;
        stroke-width: 1.85;
      }
      button .gd-formal-ic {
        margin-inline-end: 5px;
      }
      .teacher-avatar .gd-formal-ic {
        margin: 0;
        width: 24px;
        height: 24px;
      }
      .teacher-avatar .gd-formal-ic svg {
        width: 24px;
        height: 24px;
      }
    `;
    document.head.appendChild(st);
  }

  function replaceEmojisInNode(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        // تجاهل حقول الإدخال والأكواد والسكربتات
        if (/^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE)$/i.test(p.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return EMOJI_REGEX.test(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });

    const nodesToReplace = [];
    let current;
    while ((current = walker.nextNode())) {
      nodesToReplace.push(current);
    }

    let replacedCount = 0;
    nodesToReplace.forEach(textNode => {
      const text = textNode.nodeValue;
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      EMOJI_REGEX.lastIndex = 0;
      let match;

      while ((match = EMOJI_REGEX.exec(text)) !== null) {
        if (match.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        const emoji = match[0];
        const lucideName = ICON_MAP[emoji];
        if (lucideName) {
          const span = document.createElement("span");
          span.className = "gd-formal-ic";
          span.setAttribute("aria-hidden", "true");
          span.innerHTML = `<i data-lucide="${lucideName}"></i>`;
          frag.appendChild(span);
          replacedCount++;
        }
        lastIndex = EMOJI_REGEX.lastIndex;
      }

      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.parentNode.replaceChild(frag, textNode);
    });

    if (replacedCount > 0 && window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({
        root: root instanceof Element ? root : document,
        attrs: { "stroke-width": 1.85 }
      });
    }
  }

  function initFormalIcons() {
    injectFormalIconCSS();
    replaceEmojisInNode(document.body);

    // مراقبة أي عناصر تضاف ديناميكياً وتحويل أي إيموجي فيها فوراً
    let pending = false;
    const observer = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        replaceEmojisInNode(document.body);
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFormalIcons);
  } else {
    initFormalIcons();
  }
})();
