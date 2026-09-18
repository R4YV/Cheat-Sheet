(() => {
  "use strict";

  const config = window.CHEAT_SHEET_CONFIG;

  if (!config || !Array.isArray(config.sheets)) {
    console.error("CHEAT_SHEET_CONFIG was not loaded.");
    return;
  }

  const words = value =>
    value
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

  const table = document.getElementById("commands");
  const search = document.getElementById("search");
  const searchForm = document.getElementById("search-form");
  const resultCount = document.getElementById("result-count");
  const noResults = document.getElementById("no-results");
  const status = document.getElementById("copy-status");

  if (!table || !search || !searchForm || !resultCount || !noResults) {
    console.error("Required cheat-sheet elements are missing.");
    return;
  }

  const groups = Array.from(table.tBodies);

  const entries = Array
    .from(table.querySelectorAll(".entry"))
    .map(row => {
      const code = row.querySelector("code");
      const description = row.querySelector(".description");

      return {
        row,
        text: `${code?.textContent || ""} ${description?.textContent || ""}`.toLowerCase()
      };
    });

  let statusTimer;

  function announce(message) {
    if (!status) {
      return;
    }

    window.clearTimeout(statusTimer);
    status.textContent = message;

    statusTimer = window.setTimeout(() => {
      status.textContent = "";
    }, 5000);
  }

  function filterEntries() {
    const terms = words(search.value);
    let visible = 0;

    entries.forEach(entry => {
      entry.row.hidden =
        !terms.every(term => entry.text.includes(term));

      if (!entry.row.hidden) {
        visible++;
      }
    });

    groups.forEach(group => {
      group.hidden =
        !Array
          .from(group.querySelectorAll(".entry"))
          .some(row => !row.hidden);
    });

    table.hidden = visible === 0;
    noResults.hidden = visible !== 0;

    resultCount.textContent =
      `Showing ${visible} of ${entries.length} entries`;
  }

  /* ---------------------------------------------------------
     COPY BUTTONS
     --------------------------------------------------------- */

  entries.forEach((entry, index) => {
    const command = entry.row.querySelector(".command");
    const code = command?.querySelector("code");

    if (!command || !code) {
      return;
    }

    /* Avoid duplicate buttons if the script is re-run. */
    command.querySelector(".command-tools")?.remove();

    const tools = document.createElement("div");
    tools.className = "command-tools";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy";
    button.textContent = "Copy";
    button.setAttribute("aria-label", `Copy entry ${index + 1}`);

    button.addEventListener("click", async () => {
      button.disabled = true;

      try {
        if (
          !window.isSecureContext
          ||
          !navigator.clipboard?.writeText
        ) {
          throw new Error("Clipboard unavailable");
        }

        await navigator.clipboard.writeText(code.textContent);

        button.textContent = "Copied";

        announce(
          `Entry ${index + 1} copied to clipboard.`
        );
      } catch {
        const selection = window.getSelection();

        if (selection) {
          const range = document.createRange();

          range.selectNodeContents(code);

          selection.removeAllRanges();
          selection.addRange(range);

          button.textContent = "Selected";

          announce(
            "Clipboard unavailable. Text selected; use your browser's Copy command."
          );
        } else {
          announce(
            "Clipboard unavailable. Select the command and copy it manually."
          );
        }
      } finally {
        window.setTimeout(() => {
          button.textContent = "Copy";
          button.disabled = false;
        }, 1500);
      }
    });

    tools.append(button);
    command.append(tools);
  });

  /* ---------------------------------------------------------
     COMMAND SEARCH
     --------------------------------------------------------- */

  searchForm.hidden = false;

  searchForm.addEventListener("submit", event => {
    event.preventDefault();
  });

  search.addEventListener("input", filterEntries);

  document
    .getElementById("clear")
    ?.addEventListener("click", () => {
      search.value = "";
      filterEntries();
      search.focus();
    });

  document
    .getElementById("print")
    ?.addEventListener("click", () => {
      window.print();
    });

  window.addEventListener("beforeprint", () => {
    entries.forEach(entry => {
      entry.row.hidden = false;
    });

    groups.forEach(group => {
      group.hidden = false;
    });

    table.hidden = false;
    noResults.hidden = true;
  });

  window.addEventListener("afterprint", filterEntries);

  /* ---------------------------------------------------------
     AUTOMATIC COUNTS
     --------------------------------------------------------- */

  const entryTotal = document.getElementById("entry-total");
  const pageTotal = document.getElementById("page-total");

  if (entryTotal) {
    entryTotal.textContent =
      `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;
  }

  if (pageTotal) {
    pageTotal.textContent =
      `${groups.length} source ${groups.length === 1 ? "page" : "pages"}`;
  }

  groups.forEach(group => {
    const count =
      group.querySelectorAll(".entry").length;

    const label =
      group.querySelector(".page-count");

    if (label) {
      label.textContent =
        `${count} ${count === 1 ? "entry" : "entries"}`;
    }
  });

  /* ---------------------------------------------------------
     RIGHT-SIDE PDF PAGE NAVIGATION
     --------------------------------------------------------- */

  const pageNav =
    document.getElementById("sheet-page-nav");

  if (pageNav) {
    pageNav.replaceChildren();

    groups.forEach((group, index) => {
      if (!group.id) {
        return;
      }

      const link =
        document.createElement("a");

      link.href =
        `#${group.id}`;

      link.textContent =
        String(index + 1).padStart(2, "0");

      link.setAttribute(
        "aria-label",
        `PDF page ${index + 1}`
      );

      pageNav.append(link);
    });
  }

  function revealPage(target) {
    if (
      target
      &&
      groups.includes(target)
      &&
      (
        target.hidden
        ||
        table.hidden
      )
    ) {
      search.value = "";
      filterEntries();
    }
  }

  pageNav
    ?.querySelectorAll("a")
    .forEach(link => {
      link.addEventListener("click", () => {
        const target =
          document.getElementById(
            link.hash.slice(1)
          );

        revealPage(target);
      });
    });

  /* ---------------------------------------------------------
     CENTRALIZED LEFT-SIDEBAR LIBRARY
     --------------------------------------------------------- */

  const menu =
    document.getElementById("cheatsheet-links");

  const libraryCount =
    document.getElementById("library-count");

  const libraryEmpty =
    document.getElementById("library-empty");

  const libraryForm =
    document.getElementById("library-search-form");

  const librarySearch =
    document.getElementById("library-search");

  const currentSheetId =
    document.body.dataset.sheetId;

  const renderedLinks = [];

  if (menu) {
    menu.replaceChildren();

    config.sheets.forEach(sheet => {
      const item =
        document.createElement("li");

      const link =
        document.createElement("a");

      link.dataset.sheetId = sheet.id;
      link.textContent = sheet.title;

      if (sheet.id === currentSheetId) {
        link.href = "#top";
        link.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        link.href =
          window.getCheatSheetUrl(sheet);
      }

      item.append(link);
      menu.append(item);

      renderedLinks.push(link);
    });
  }

  function filterLibrary() {
    if (
      !librarySearch
      ||
      !libraryCount
      ||
      !libraryEmpty
    ) {
      return;
    }

    const terms =
      words(librarySearch.value);

    let visible = 0;

    renderedLinks.forEach(link => {
      const title =
        link.textContent.toLowerCase();

      const matches =
        terms.every(
          term => title.includes(term)
        );

      link.closest("li").hidden =
        !matches;

      if (matches) {
        visible++;
      }
    });

    libraryEmpty.hidden =
      visible !== 0;

    libraryCount.textContent =
      terms.length
        ? `${visible} / ${renderedLinks.length}`
        : `${renderedLinks.length} ${renderedLinks.length === 1 ? "sheet" : "sheets"}`;
  }

  if (libraryForm && librarySearch) {
    libraryForm.hidden =
      renderedLinks.length <= 5;

    libraryForm.addEventListener(
      "submit",
      event => {
        event.preventDefault();
      }
    );

    librarySearch.addEventListener(
      "input",
      filterLibrary
    );
  }

  filterLibrary();

  /* ---------------------------------------------------------
     CENTRALIZED PREVIOUS / NEXT
     --------------------------------------------------------- */

  const pagination =
    document.getElementById("sheet-pagination");

  const currentIndex =
    config.sheets.findIndex(
      sheet => sheet.id === currentSheetId
    );

  function makePaginationControl(
    sheet,
    label,
    relation
  ) {
    const control =
      document.createElement(
        sheet
          ? "a"
          : "button"
      );

    control.className = "button";

    control.textContent =
      relation === "prev"
        ? `← ${label}`
        : `${label} →`;

    if (sheet) {
      control.href =
        window.getCheatSheetUrl(sheet);

      control.rel =
        relation;

      control.setAttribute(
        "aria-label",
        `${label}: ${sheet.title}`
      );
    } else {
      control.type = "button";
      control.disabled = true;
    }

    return control;
  }

  if (
    pagination
    &&
    currentIndex !== -1
  ) {
    pagination.replaceChildren(
      makePaginationControl(
        config.sheets[currentIndex - 1],
        "Previous Page",
        "prev"
      ),

      makePaginationControl(
        config.sheets[currentIndex + 1],
        "Next Page",
        "next"
      )
    );

    pagination.hidden = false;
  }

  /* ---------------------------------------------------------
     RESPONSIVE SIDEBAR
     --------------------------------------------------------- */

  const sidebar =
    document.getElementById("site-sidebar");

  const panel =
    document.getElementById("sidebar-panel");

  const toggle =
    document.getElementById("sidebar-toggle");

  const smallScreen =
    window.matchMedia(
      "(max-width: 1024px)"
    );

  function setExpanded(
    expanded,
    restoreFocus = false
  ) {
    if (!panel || !toggle) {
      return;
    }

    panel.hidden =
      !expanded;

    toggle.setAttribute(
      "aria-expanded",
      String(expanded)
    );

    toggle.textContent =
      expanded
        ? "Close"
        : "Menu";

    if (restoreFocus) {
      toggle.focus({
        preventScroll: true
      });
    }
  }

  function syncViewport() {
    if (!panel || !toggle) {
      return;
    }

    const focusWasInside =
      panel.contains(
        document.activeElement
      );

    toggle.hidden =
      !smallScreen.matches;

    setExpanded(
      !smallScreen.matches,
      smallScreen.matches
      &&
      focusWasInside
    );
  }

  toggle?.addEventListener(
    "click",
    () => {
      setExpanded(panel.hidden);
    }
  );

  sidebar?.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Escape"
        &&
        smallScreen.matches
        &&
        panel
        &&
        !panel.hidden
      ) {
        event.preventDefault();

        setExpanded(
          false,
          true
        );
      }
    }
  );

  smallScreen.addEventListener(
    "change",
    syncViewport
  );

  document.body.classList.add(
    "navigation-ready"
  );

  syncViewport();
  filterEntries();

  /* ---------------------------------------------------------
     HASH NAVIGATION
     --------------------------------------------------------- */

  function revealHashTarget() {
    if (!window.location.hash) {
      return;
    }

    let id;

    try {
      id =
        decodeURIComponent(
          window.location.hash.slice(1)
        );
    } catch {
      return;
    }

    const target =
      document.getElementById(id);

    revealPage(target);
  }

  window.addEventListener(
    "hashchange",
    revealHashTarget
  );

  revealHashTarget();
})();
