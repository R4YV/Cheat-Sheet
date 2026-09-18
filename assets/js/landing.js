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

  const outputEmpty =
    document.getElementById("output-empty");

  const optionList =
    document.getElementById("option-list");

  if (
    !config
    ||
    !form
    ||
    !input
    ||
    !outputHistory
    ||
    !outputEmpty
    ||
    !optionList
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
     RENDER THE RIGHT-SIDE OPTIONS FROM THE CENTRAL MANIFEST
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

  function createOutputBlock(command) {
    outputEmpty.hidden = true;

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

    return response;
  }

  function clearOutput() {
    outputHistory.replaceChildren();

    outputEmpty.hidden = false;
    outputEmpty.textContent =
      "Waiting for input...";
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
      `Available commands:

<span class="cmd">help</span>         Display this help message
<span class="cmd">clear</span>        Clear the command output
<span class="cmd">use &lt;number&gt;</span>  Open a cheat sheet

Available cheat sheets:

${available}`;
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
        `Invalid selection: ${escapeHTML(number)}
Type <span class="cmd">help</span> to view available options.`;

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
      `Unknown command: ${escapeHTML(command)}
Type <span class="cmd">help</span> for available commands.`;
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
      input.focus();
    }
  );
})();
