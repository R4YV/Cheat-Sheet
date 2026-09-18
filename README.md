# Centralized Cheat-Sheet Architecture

This version centralizes all shared navigation and common page behavior.

## Important files

- `assets/js/cheatsheets.js`
  - Single source of truth for the cheat-sheet library.
  - Add new pages here once.

- `assets/js/cheatsheet.js`
  - Builds the sidebar.
  - Builds Previous / Next controls.
  - Builds the right-side PDF page navigation.
  - Handles search, copy, print, counts, and responsive sidebar behavior.

- `assets/css/cheatsheet.css`
  - Shared styling for every individual cheat-sheet page.

- `assets/js/landing.js`
  - Builds the landing-page numbered list from the same central registry.
  - Implements `help`, `clear`, and `use <number>`.

- `assets/css/landing.css`
  - Landing-page terminal styling.

## Adding a new cheat sheet

1. Copy `_template/index.html` into a new folder.
2. Replace the page-specific content in that new file.
3. Add one object to `assets/js/cheatsheets.js`.

Example:

```js
Object.freeze({
  id: "active-directory-enumeration",
  title: "Active Directory Enumeration",
  folder: "ActiveDirectoryEnumeration"
})
```

That is the only existing file that needs to be edited.

The new page automatically appears in:

- Landing-page CLI menu
- Every cheat-sheet sidebar
- Previous / Next navigation
- Library count
- Library search

## GitHub Pages root

The registry currently uses:

```js
rootPath: "/Cheat-Sheet/"
```

This matches:

`https://r4yv.github.io/Cheat-Sheet/`

If the repository name changes, update `rootPath` once.

## favicon

Keep your existing `dagger.svg` in the repository root:

`Cheat-Sheet/dagger.svg`

The generated HTML pages reference that file.

## Landing page interactive library

The landing page no longer shows the reference-library panel by default.

CLI commands:

- `ls` lists `interactive.sh`
- `./interactive.sh` slides the centralized cheat-sheet library in from the right
- `exit` slides the library back out
- `use <number>` still opens a cheat sheet
- `clear` clears command output

The interactive panel is generated from the same `assets/js/cheatsheets.js` registry, so new pages are automatically included.

## Landing-page viewport behavior

The CLI landing page is locked to the browser viewport, so normal command output does not create a browser-level vertical scrollbar.

- Only the Command Output history pane scrolls vertically when output exceeds its available height.
- The CLI prompt/input remains fixed below the CPTS project text.
- `Waiting for input...` is shown as the CLI input placeholder instead of inside the output pane.
