# Kronos beta page

Static marketing page for the Kronos private beta, served by GitHub Pages.

- `palette.py` rerolls the color tokens in `styles.css` from a seed.
- The signup form and visit counter post to a Google Apps Script web app
  (`apps-script/Code.gs`) that writes to a Google Sheet. Set its `/exec` URL
  in the form's `data-endpoint` attribute in `index.html`.
