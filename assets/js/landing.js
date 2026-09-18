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

    window.requestAnimationFrame(() => {
      outputScroll.scrollTop = outputScroll.scrollHeight;
    });

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
      `Available commands:\n\n<span class="cmd">help</span>              Display this help message\n<span class="cmd">ls</span>                List files in the current directory\n<span class="cmd">clear</span>             Clear the command output\n<span class="cmd">./interactive.sh</span>  Open the interactive cheat-sheet library\n<span class="cmd">exit</span>              Close the interactive cheat-sheet library\n<span class="cmd">use &lt;number&gt;</span>      Open a cheat sheet\n\nAvailable cheat sheets:\n\n${available}`;
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
