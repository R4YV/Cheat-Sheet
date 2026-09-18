(() => {
  "use strict";

  window.CHEAT_SHEET_CONFIG = Object.freeze({
    rootPath: "/Cheat-Sheet/",

    sheets: Object.freeze([
      Object.freeze({
        id: "shells-payloads-upc00",
        title: "Shells & Payloads",
        folder: "ShellsAndPayloads"
      }),

      Object.freeze({
        id: "network-enumeration-nmap",
        title: "Network Enumeration with Nmap",
        folder: "NetworkEnumNmap"
      }),

      Object.freeze({
        id: "using-metasploit-framework",
        title: "Using the Metasploit Framework",
        folder: "MetasploitFramework"
      }),

      Object.freeze({
        id: "password-attacks",
        title: "Password Attacks",
        folder: "PasswordAttacks"
      })
    ])
  });

  window.getCheatSheetUrl = function getCheatSheetUrl(sheet) {
    return `${window.CHEAT_SHEET_CONFIG.rootPath}${sheet.folder}/`;
  };
})();
