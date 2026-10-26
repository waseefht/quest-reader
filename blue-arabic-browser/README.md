# متصفح بلو العربي (Blue Arabic Browser) v1.0

A normal 2D Android browser (phones such as the Redmi Note 14 Pro, and Meta Quest 2 as a 2D panel app) that shows any website in Arabic.

* **ع (full Arabic):** the text is replaced in place, the page uses a Naskh Arabic font, and blocks are right-to-left. You can optionally flip the whole page to RTL.
* **ع|A (bilingual):** the Arabic translation appears directly under each paragraph.
* Pages are translated automatically when they load. The global default is Arabic, and you can set a mode per site from the toolbar button or the menu.
* Dynamic content is translated too (MutationObserver and infinite scroll), visible content first (IntersectionObserver). This also covers the page title, menus, buttons, placeholders, aria-labels and alt text. Selected text gets "ترجم للعربية" and "اقرأ" actions.
* Tabs, bookmarks, a home page with labeled AI search engines, and a searchable "روابط سريعة" page with 1,595 links. Each link can be opened normally (↗), translated (ع) or bilingual (ع|A).
* Read aloud uses Microsoft Edge neural voices (no key), with Amany ar-SY as the default and a voice picker plus speed control. It is chunked and prefetched so playback starts fast, and falls back to Android TextToSpeech when offline.
* No API keys, no Google Play services. Permissions are only INTERNET and ACCESS_NETWORK_STATE.

## Engine
The app uses Android System WebView plus `assets/translate.js`, injected at document start. Translation requests are made natively with OkHttp, so the page's CSP/CORS cannot block them. Providers are tried in this order: Google `translate_a/t` gtx (HTML-segment mode, batched), then clients5 dict-chrome-ex, then MyMemory. Results are cached in an LRU cache and in SQLite.

## Build
`./gradlew assembleRelease` (JDK 17). Release signing reads `keystore.properties` (not committed).
`jstest/chrome_shots.js` runs the same translate.js on live sites in desktop Chrome for screenshots.
