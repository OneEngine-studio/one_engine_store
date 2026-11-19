# Changelog

## 1.2.0 (2026-11-20)

### Added
- Publish a build: approved accounts upload a game zip from the launcher; the server checks it, makes it live and removes the old build.
- Update button in the title bar when a newer launcher is released.
- Adding a password to an account made with Google now works (the service supports it).

## 1.1.0 (2026-11-17)

### Added
- Railbound 1.0.1 published as a free download (sign in, Add to library, Install).
- Coins screen with Stripe Checkout through the payments service.
- Category cards and a focus carousel on the Store; a full-width game page with a floating price card.
- Glossy 3D icon set, loading skeletons, empty states for Activity, Library, Downloads and notifications.
- `/` opens search. `publish-build` checks that the zip contains its executable and no debug folders.

### Changed
- Maroon and red design with Poppins and a chunky display face; new interface sounds.
- Tab switches only fade; the staggered entrance plays on the first screen of a session.
- Minimum text size 12px; brighter secondary text.

### Fixed
- Esc closing the command palette no longer navigates back.
- Empty stats ring and progress bar no longer look partly filled.
- Free-space check before installing plans for the unpacked size of large games.
- Share on a game page copies plain text instead of a link nothing could open.

### Removed
- Google Fonts requests (fonts are bundled) and four unused components.
