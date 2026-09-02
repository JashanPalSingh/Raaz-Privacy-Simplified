# Raaz: Privacy Simplified

Raaz is a lightweight Chrome extension that helps reduce common forms of online tracking from a single popup. It blocks known ad and tracker domains, disables third-party cookies, removes `Referer` headers, and provides optional email safety tools.

## Features

- **Ad and tracker blocking:** Blocks requests to the domains bundled in `blocked_domains.json` and `blocked_trackers.json`.
- **Third-party cookie blocking:** Disables third-party cookies while the main privacy toggle is enabled.
- **Referer header removal:** Removes `Referer` request headers to reduce the browsing context shared with websites.
- **Phishing reminder:** Optionally displays safe-email reminders when Gmail, Outlook, or Yahoo Mail is opened.
- **Email breach lookup:** Checks an email address against the Have I Been Pwned API.
- **Security dashboard:** Shows the bundled list sizes and blocking counts for the current browser session.

The main privacy protections are enabled by default. Settings are stored with Chrome Sync, so they can persist across supported Chrome installations.

## Installation

Raaz is currently installed as an unpacked extension:

1. Clone or download this repository.
2. Open `chrome://extensions` in Google Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository folder.
6. Pin Raaz from the Extensions menu to access its popup.

After changing the source files, return to `chrome://extensions` and select **Reload** on the Raaz extension.

## Usage

Open the Raaz popup from the Chrome toolbar and use the main switch to enable or disable the privacy protections. The phishing reminder has its own switch. The popup also provides separate views for the email breach lookup and the security dashboard.

## Project Structure

| File | Purpose |
| --- | --- |
| `manifest.json` | Chrome extension metadata, permissions, popup, and service worker configuration |
| `index.html` | Popup interface |
| `home.js` | Popup interactions, settings, breach lookup, and dashboard display |
| `backend.js` | Background service worker for blocking rules, privacy settings, reminders, and statistics |
| `generalstyle.css` | Popup styling |
| `blocked_domains.json` | Bundled ad-domain list |
| `blocked_trackers.json` | Bundled tracker-domain list |

## Permissions

Raaz requests broad permissions because its protections operate across websites:

- `declarativeNetRequest` to create blocking and header-modification rules
- `privacy` to control third-party cookie behavior
- `tabs` and `scripting` for email-service detection and the phishing reminder
- `storage` to save user preferences and session data
- `notifications` and `cookies` for browser privacy features
- `<all_urls>` so the blocking rules can apply across visited websites

## Important Notes

- Blocking depends on the domains included in the bundled JSON lists. It is not a guarantee that every advertisement or tracker will be blocked.
- Disabling the main switch may require reopening the browser for all Chrome privacy changes to take effect.
- The email breach lookup sends the entered address to the Have I Been Pwned API and requires a valid API key.
- The current implementation includes the Have I Been Pwned API key directly in `home.js`. Do not publish or reuse that key. For a public or production deployment, move the request behind a secure backend or inject the key through a private development configuration.
- Raaz is an educational project and should not be treated as a complete security or anonymity solution.

## Development

No build step or package manager is required. The extension consists of browser-native HTML, CSS, JavaScript, JSON, and a Manifest V3 service worker. Edit the files locally, reload the unpacked extension, and test the behavior in Chrome.

## Authors

- Jashan Pal Singh
- Ishan Ishan

## License

No license has been specified for this repository yet. Add a license before accepting external contributions or defining reuse terms.