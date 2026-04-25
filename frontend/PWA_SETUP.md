# PWA Setup Instructions

Your application has been configured as a Progressive Web App (PWA)!

## What's Been Added

1. **vite-plugin-pwa** - Handles service worker generation and PWA manifest
2. **Updated vite.config.ts** - Configured with PWA settings including:
   - Auto-update service worker
   - Offline caching strategies
   - API caching with NetworkFirst strategy
   - Font caching
3. **Updated index.html** - Added PWA meta tags and theme color
4. **Icon files** - Placeholder icons need to be generated

## Generate PWA Icons

You need to create the following icon files in the `public` folder:

- `pwa-192x192.png` (192x192 pixels)
- `pwa-512x512.png` (512x512 pixels)
- `apple-touch-icon.png` (180x180 pixels)

### Option 1: Use an Online Tool
1. Visit https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload your logo/icon
3. Generate and download the icons
4. Place them in the `frontend/public` folder

### Option 2: Use the HTML Generator
1. Open `frontend/public/pwa-icon-generator.html` in a browser
2. Click the download buttons to generate placeholder icons
3. Move the downloaded files to `frontend/public`

### Option 3: Convert the SVG
1. Use an online SVG to PNG converter like https://cloudconvert.com/svg-to-png
2. Convert `frontend/public/icon.svg` to PNG at different sizes
3. Save as the required filenames in `frontend/public`

## Testing Your PWA

1. Build the application:
   ```bash
   npm run build
   ```

2. Preview the production build:
   ```bash
   npm run preview
   ```

3. Open Chrome DevTools > Application > Manifest to verify the PWA configuration

4. Test the service worker in the Application > Service Workers tab

5. Try installing the PWA using the browser's install prompt

## PWA Features

- **Offline Support**: The app will work offline after the first visit
- **Installable**: Users can install the app on their device
- **Auto-updates**: Service worker updates automatically
- **Caching Strategies**:
  - Static assets: Cached for offline use
  - API calls: Network-first with 5-minute cache fallback
  - Fonts: Cached for 1 year

## Customization

Edit `frontend/vite.config.ts` to customize:
- App name and description
- Theme colors
- Caching strategies
- Icon paths
- Service worker behavior

## Notes

- The service worker only works in production builds (not in dev mode)
- HTTPS is required for PWA features (except on localhost)
- Test on actual mobile devices for the best experience
