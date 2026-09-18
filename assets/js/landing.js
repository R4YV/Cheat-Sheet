(() => {
  "use strict";

  const config =
    window.CHEAT_SHEET_CONFIG;

  const form =
    document.getElementById("cli-form");

  const input =
    document.getElementById("cli-input");

  const outputHistory =
    document.getElementById("output-history");

  const outputScroll =
    document.getElementById("output-scroll");

  const optionList =
    document.getElementById("option-list");

  const interactivePanel =
    document.getElementById("interactive-panel");

  if (
    !config
    ||
    !form
    ||
    !input
    ||
    !outputHistory
    ||
    !outputScroll
    ||
    !optionList
    ||
    !interactivePanel
  ) {
    console.error("Landing page initialization failed.");
    return;
  }

  const SEARCH_CACHE_PREFIX =
    "cpts-cheat-search-index:";

  const MAX_RESULTS = 100;

  let searchIndexPromise = null;

  function escapeHTML(value) {
    return value.replace(
      /[&<>"']/g,
      character => {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "\"": "&quot;",
          "'": "&#039;"
        };

        return entities[character];
      }
    );
  }

  function searchTerms(value) {
    return value
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }

  function scrollOutputToBottom() {
    window.requestAnimationFrame(() => {
      outputScroll.scrollTop =
        outputScroll.scrollHeight;
    });
  }

  /* ---------------------------------------------------------
     CENTRALIZED INTERACTIVE LIBRARY
     --------------------------------------------------------- */

  optionList.replaceChildren();

  config.sheets.forEach(
    (sheet, index) => {
      const item =
        document.createElement("li");

      item.className =
        "option-item";

      const link =
        document.createElement("a");

      link.className =
        "option-link";

      link.href =
        window.getCheatSheetUrl(sheet);

      link.dataset.number =
        String(index + 1);

      const number =
        document.createElement("span");

      number.className =
        "option-number";

      number.textContent =
        `[${index + 1}]`;

      const name =
        document.createElement("span");

      name.className =
        "option-name";

      name.textContent =
        sheet.title;

      link.append(
        number,
        name
      );

      item.append(link);
      optionList.append(item);
    }
  );

  function isInteractiveOpen() {
    return document.body.classList.contains(
      "interactive-open"
    );
  }

  function openInteractivePanel() {
    document.body.classList.add(
      "interactive-open"
    );

    interactivePanel.removeAttribute(
      "inert"
    );

    interactivePanel.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  function closeInteractivePanel() {
    document.body.classList.remove(
      "interactive-open"
    );

    interactivePanel.setAttribute(
      "inert",
      ""
    );

    interactivePanel.setAttribute(
      "aria-hidden",
      "true"
    );

    input.focus();
  }

  /* ---------------------------------------------------------
     COMMAND OUTPUT
     --------------------------------------------------------- */

  function createOutputBlock(command) {
    const block =
      document.createElement("div");

    block.className =
      "output-block";

    const commandLine =
      document.createElement("p");

    commandLine.className =
      "output-command";

    const prefix =
      document.createElement("span");

    prefix.className =
      "output-command-prefix";

    prefix.textContent =
      "bash: ";

    commandLine.append(
      prefix,
      document.createTextNode(command)
    );

    const response =
      document.createElement("div");

    response.className =
      "output-response";

    block.append(
      commandLine,
      response
    );

    outputHistory.append(block);
    scrollOutputToBottom();

    return response;
  }

  function clearOutput() {
    outputHistory.replaceChildren();
    outputScroll.scrollTop = 0;
  }

  function showHelp(response) {
    const available =
      config.sheets
        .map(
          (sheet, index) =>
            `<span class="cmd">use ${index + 1}</span>  ${escapeHTML(sheet.title)}`
        )
        .join("<br>");

    response.innerHTML =
      `Available commands:\n\n<span class="cmd">help</span>              Display this help message\n<span class="cmd">ls</span>                List files in the current directory\n<span class="cmd">clear</span>             Clear the command output\n<span class="cmd">locate &lt;word&gt;</span>     Search commands and descriptions\n<span class="cmd">which &lt;word&gt;</span>      Prioritize command/value matches\n<span class="cmd">./interactive.sh</span>  Open the interactive cheat-sheet library\n<span class="cmd">exit</span>              Close the interactive cheat-sheet library\n<span class="cmd">use &lt;number&gt;</span>      Open a cheat sheet\n\nAvailable cheat sheets:\n\n${available}`;
  }

  function showDirectory(response) {
    response.innerHTML =
      `<span class="cmd">interactive.sh</span>`;
  }

  function navigateByNumber(
    number,
    response
  ) {
    const index =
      Number(number) - 1;

    const sheet =
      config.sheets[index];

    if (!sheet) {
      response.classList.add(
        "error"
      );

      response.innerHTML =
        `Invalid selection: ${escapeHTML(number)}\nType <span class="cmd">help</span> to view available options.`;

      return;
    }

    response.textContent =
      `Opening ${sheet.title}...`;

    window.setTimeout(
      () => {
        window.location.href =
          window.getCheatSheetUrl(sheet);
      },
      250
    );
  }

  /* ---------------------------------------------------------
     SEARCH INDEX
     --------------------------------------------------------- */

  function getSearchCacheKey() {
    const signature =
      config.sheets
        .map(sheet => `${sheet.id}:${sheet.folder}`)
        .join("|");

    return `${SEARCH_CACHE_PREFIX}${signature}`;
  }

  function readSearchCache() {
    try {
      const raw =
        window.sessionStorage.getItem(
          getSearchCacheKey()
        );

      if (!raw) {
        return null;
      }

      const parsed =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

  function writeSearchCache(entries) {
    try {
      window.sessionStorage.setItem(
        getSearchCacheKey(),
        JSON.stringify(entries)
      );
    } catch {
      /* Search still works if sessionStorage is unavailable. */
    }
  }

  async function fetchSheetEntries(sheet) {
    const response =
      await fetch(
        window.getCheatSheetUrl(sheet),
        {
          credentials: "same-origin"
        }
      );

    if (!response.ok) {
      throw new Error(
        `Unable to load ${sheet.title} (${response.status})`
      );
    }

    const html =
      await response.text();

    const documentNode =
      new DOMParser().parseFromString(
        html,
        "text/html"
      );

    return Array
      .from(
        documentNode.querySelectorAll(
          "#commands .entry"
        )
      )
      .map((row, entryIndex) => {
        const command =
          row.querySelector("code")
            ?.textContent
            .trim()
          || "";

        const description =
          row.querySelector(".description")
            ?.textContent
            .replace(/\s+/g, " ")
            .trim()
          || "";

        return {
          sheetId: sheet.id,
          sheetTitle: sheet.title,
          sheetUrl: window.getCheatSheetUrl(sheet),
          entryIndex,
          command,
          description,
          commandLower: command.toLowerCase(),
          descriptionLower: description.toLowerCase()
        };
      })
      .filter(entry => entry.command);
  }

  async function buildSearchIndex() {
    const cached =
      readSearchCache();

    if (cached) {
      return cached;
    }

    const sheetResults =
      await Promise.all(
        config.sheets.map(fetchSheetEntries)
      );

    const entries =
      sheetResults.flat();

    writeSearchCache(entries);

    return entries;
  }

  function getSearchIndex() {
    if (!searchIndexPromise) {
      searchIndexPromise =
        buildSearchIndex()
          .catch(error => {
            searchIndexPromise = null;
            throw error;
          });
    }

    return searchIndexPromise;
  }

  function rankWhichEntry(entry, query, terms) {
    if (entry.commandLower === query) {
      return 0;
    }

    if (entry.commandLower.startsWith(query)) {
      return 1;
    }

    if (
      terms.every(
        term => entry.commandLower.includes(term)
      )
    ) {
      return 2;
    }

    if (
      terms.every(
        term => entry.descriptionLower.includes(term)
      )
    ) {
      return 3;
    }

    const combined =
      `${entry.commandLower} ${entry.descriptionLower}`;

    if (
      terms.every(
        term => combined.includes(term)
      )
    ) {
      return 4;
    }

    return Number.POSITIVE_INFINITY;
  }

  function locateEntries(entries, query) {
    const terms =
      searchTerms(query);

    return entries.filter(entry => {
      const combined =
        `${entry.commandLower} ${entry.descriptionLower}`;

      return terms.every(
        term => combined.includes(term)
      );
    });
  }

  function whichEntries(entries, query) {
    const normalizedQuery =
      query.trim().toLowerCase();

    const terms =
      searchTerms(query);

    return entries
      .map(entry => ({
        entry,
        rank: rankWhichEntry(
          entry,
          normalizedQuery,
          terms
        )
      }))
      .filter(item =>
        Number.isFinite(item.rank)
      )
      .sort((a, b) => {
        if (a.rank !== b.rank) {
          return a.rank - b.rank;
        }

        return a.entry.entryIndex - b.entry.entryIndex;
      })
      .map(item => item.entry);
  }

  function renderSearchResults(
    response,
    query,
    results
  ) {
    response.replaceChildren();
    response.classList.add(
      "search-response"
    );

    if (!results.length) {
      const empty =
        document.createElement("p");

      empty.className =
        "search-empty";

      empty.textContent =
        `No cheat-sheet entries found for: ${query}`;

      response.append(empty);
      scrollOutputToBottom();
      return;
    }

    const visibleResults =
      results.slice(0, MAX_RESULTS);

    visibleResults.forEach(
      (entry, index) => {
        const result =
          document.createElement("div");

        result.className =
          "search-result";

        const command =
          document.createElement("pre");

        command.className =
          "search-result-command";

        command.textContent =
          entry.command;

        const description =
          document.createElement("p");

        description.className =
          "search-result-description";

        description.textContent =
          `# ${entry.description}`;

        result.append(
          command,
          description
        );

        if (index < visibleResults.length - 1) {
          result.append(
            document.createElement("br")
          );
        }

        response.append(result);
      }
    );

    if (results.length > MAX_RESULTS) {
      const notice =
        document.createElement("p");

      notice.className =
        "search-truncated";

      notice.textContent =
        `Showing ${MAX_RESULTS} of ${results.length} matches. Refine your search to narrow the results.`;

      response.append(notice);
    }

    scrollOutputToBottom();
  }

  async function runCheatSearch(
    mode,
    query,
    response
  ) {
    const trimmedQuery =
      query.trim();

    if (!trimmedQuery) {
      response.classList.add(
        "error"
      );

      response.textContent =
        `Usage: ${mode} <word>`;

      return;
    }

    response.classList.add(
      "search-loading"
    );

    response.textContent =
      "Indexing cheat sheets...";

    try {
      const entries =
        await getSearchIndex();

      const results =
        mode === "which"
          ? whichEntries(entries, trimmedQuery)
          : locateEntries(entries, trimmedQuery);

      response.classList.remove(
        "search-loading"
      );

      renderSearchResults(
        response,
        trimmedQuery,
        results
      );
    } catch (error) {
      response.classList.remove(
        "search-loading"
      );

      response.classList.add(
        "error"
      );

      response.textContent =
        "Unable to build the cheat-sheet search index. Run this page through GitHub Pages or another HTTP server and try again.";

      console.error(error);
    }
  }

  /* ---------------------------------------------------------
     COMMAND PROCESSOR
     --------------------------------------------------------- */

  function processCommand(
    rawCommand
  ) {
    const command =
      rawCommand.trim();

    if (!command) {
      return;
    }

    const normalized =
      command.toLowerCase();

    if (
      normalized
      ===
      "clear"
    ) {
      clearOutput();
      return;
    }

    const response =
      createOutputBlock(command);

    if (
      normalized
      ===
      "help"
    ) {
      showHelp(response);
      return;
    }

    if (
      normalized
      ===
      "ls"
    ) {
      showDirectory(response);
      return;
    }

    if (
      normalized
      ===
      "./interactive.sh"
    ) {
      openInteractivePanel();

      response.textContent =
        isInteractiveOpen()
          ? "Interactive cheat-sheet library opened."
          : "Unable to open interactive mode.";

      return;
    }

    if (
      normalized
      ===
      "exit"
    ) {
      const wasOpen =
        isInteractiveOpen();

      closeInteractivePanel();

      response.textContent =
        wasOpen
          ? "Interactive cheat-sheet library closed."
          : "No interactive session is active.";

      return;
    }

    const locateMatch =
      command.match(
        /^locate(?:\s+(.+))?$/i
      );

    if (locateMatch) {
      void runCheatSearch(
        "locate",
        locateMatch[1] || "",
        response
      );

      return;
    }

    const whichMatch =
      command.match(
        /^which(?:\s+(.+))?$/i
      );

    if (whichMatch) {
      void runCheatSearch(
        "which",
        whichMatch[1] || "",
        response
      );

      return;
    }

    const useMatch =
      normalized.match(
        /^use\s+(\d+)$/
      );

    if (useMatch) {
      navigateByNumber(
        useMatch[1],
        response
      );

      return;
    }

    response.classList.add(
      "error"
    );

    response.innerHTML =
      `Unknown command: ${escapeHTML(command)}\nType <span class="cmd">help</span> for available commands.`;
  }

  form.addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const command =
        input.value;

      input.value = "";

      processCommand(command);

      input.focus();
    }
  );

  document
    .querySelector(".terminal-left")
    ?.addEventListener(
      "click",
      event => {
        if (
          event.target.closest(
            "a, input"
          )
        ) {
          return;
        }

        input.focus();
      }
    );

  window.addEventListener(
    "load",
    () => {
      closeInteractivePanel();
      input.focus();
    }
  );
})();
