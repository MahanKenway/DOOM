# ممیزی catalog، مجوز و سازگاری RIFTWAD

**دامنهٔ گزارش.** این catalog میان مجوز source code و اجازهٔ مستقل برای بازتوزیع WAD، map، texture، sprite و موسیقی تمایز می‌گذارد. عمومی‌بودن یک repository به‌تنهایی اجازهٔ bundle کردن محتوای بازی نیست. RIFTWAD فقط عنوانی را در build قرار می‌دهد که مسیر مجوز و منبع آن روشن باشد؛ سایر موارد یا به‌صورت فایل محلیِ مالک کاربر یا به‌شکل مطالعهٔ engine فهرست می‌شوند.

| عنوان | وضعیت catalog | وضعیت اجرا در RIFTWAD | مبنای مجوز / policy |
|---|---|---|---|
| Freedoom: Phase 1 | Bundled IWAD | قابل اجرا | محتوای آزاد Freedoom با attribution حفظ‌شده [1] |
| Freedoom: Phase 2 | Bundled IWAD | قابل اجرا | محتوای آزاد Freedoom با attribution حفظ‌شده [1] |
| FreeDM: Arena Archive | Bundled IWAD | قابل اجرا برای exploration محلی؛ بدون bot یا multiplayer | archive رسمی خانوادهٔ Freedoom با attribution حفظ‌شده [1] |
| The Plutonia Experiment | Owned file | فقط پس از انتخاب WAD قانونی کاربر | Final Doom تجاری؛ هیچ archive یا dataای bundle نمی‌شود [2] |
| TNT: Evilution | Owned file | فقط پس از انتخاب WAD قانونی کاربر | Final Doom تجاری؛ هیچ archive یا dataای bundle نمی‌شود [3] |
| Community WAD shelf | Local import | یک IWAD و حداکثر سه PWAD محلی | حق استفاده و سازگاری بر عهدهٔ کاربر؛ فایل‌ها upload نمی‌شوند |
| Blasphemer | External engine | غیرقابل اجرا در runtime فعلی | محتوای آزاد برای engine خانوادهٔ Heretic است، نه Doom 1.10 [4] |
| OpenResident | WebGL2 study | فقط graphics probe؛ بازی نیست | source engine با BSD-2-Clause و بدون game data [5] |

## محدودیت سازگاری runtime

RIFTWAD فعلی یک browser build از **linuxdoom 1.10** با loader سازگار با WADهای Doom است. بنابراین نباید سازگاری با GZDoom/ZScript/UDMF، formatهای Heretic/Hexen یا total conversionهای مدرن را ادعا کند. Blasphemer با وجود وضعیت آزاد محتوا، به یک engine سازگار با Heretic نیاز دارد؛ به همین دلیل فقط به‌عنوان title خارجی و غیرقابل‌اجرا نمایش داده می‌شود [4].

| خانوادهٔ runtime | رفتار صادقانه در این build |
|---|---|
| Doom-compatible IWAD | Freedoom Phase 1، Phase 2 و FreeDM bundle و قابل launch هستند. |
| Doom-compatible PWAD | تنها همراه با IWAD محلی و پس از انتخاب کاربر قابل load است. |
| Heretic-compatible IWAD | در catalog می‌تواند معرفی شود، اما launch نمی‌شود. |
| GZDoom-era release | تا زمان ساخت adapter اختصاصی، قابل اجرا یا bundled معرفی نمی‌شود. |

## سیاست screenshot و attribution

هیچ artwork مولدی در catalog فعال وجود ندارد. چهار cover تولیدشدهٔ پیشین از repository حذف شده‌اند و همهٔ کارت‌ها از screenshot واقعی gameplay استفاده می‌کنند. attribution هر asset در `ASSETS.md` و در metadata همان card نگهداری می‌شود.

| Asset | منبع screenshot | credit نمایشی |
|---|---|---|
| `freedoom-phase1.png`، `freedoom-phase2.png` و `freedm.png` | پروژهٔ رسمی Freedoom [1] | Freedoom project |
| `plutonia-gateway-of-hell.webp` | Doom Wiki / Fandom، MAP30 [2] | Doom Wiki / Fandom |
| `tnt-steel-works.webp` | Doom Wiki / Fandom، MAP14 [3] | Doom Wiki / Fandom |
| `blasphemer-gameplay.webp` | image ارجاع‌شده در README پروژه [4] | Blasphemer project / jeshimoth.com |
| `openresident-gameplay.webp` | image ارجاع‌شده در README upstream [5] | XProger/OpenResident README |

## OpenResident: نتیجهٔ prototype WebAssembly

> **نتیجه:** تبدیل فنی به WebAssembly/WebGL2 ممکن است، اما این نتیجه به‌معنای قابل‌بازی‌بودن Resident Evil در RIFTWAD نیست.

یک adapter جداگانه از revision `00711c427297d70664be1fa86201bea11b9a9a04` مخزن OpenResident ساخته شد. Adapter با Emscripten و WebGL2-only build کامپایل شده، یک WASM حدود 5.6 KB و loader ES module حدود 33 KB تولید کرد و در Chromium، lifecycle renderer را بدون خطای console با نتیجهٔ `PASS` اجرا کرد. صفحهٔ `openresident.html` همین probe را در build منتشرشده نمایش می‌دهد؛ آن صفحه صریحاً هیچ game dataای را bundle، mount، درخواست یا دانلود نمی‌کند.

برای تبدیل این مطالعه به بازی واقعی، هنوز یک platform layer کامل برای فایل‌ها، input، audio و lifecycle، flow قانونیِ data محلی، parity renderer و آزمون end-to-end همهٔ game pathها لازم است. تا آن زمان، کارت OpenResident عمداً با برچسب **WEBGL2 STUDY** و نه «Play» نمایش داده می‌شود.

## آزمون‌های انجام‌شده

| آزمون | نتیجه |
|---|---|
| Syntax ماژول‌های تغییریافته | PASS |
| بررسی assetهای catalog و نبود reference به coverهای مولد | PASS |
| ساخت local adapter OpenResident با پرچم‌های workflow | PASS |
| اجرای `openresident.html` و WebGL2 lifecycle در Chromium | PASS، بدون خطای console |
| ساختار کنترل‌های PSP | PASS؛ D-pad، L/R، چهار face button و drag-look روی game layer مشاهده و accessibility-discoverable شدند |
| smoke test `scripts/validate-riftwad.sh` | PASS |

## منابع

[1]: https://github.com/freedoom/freedoom "Freedoom repository"
[2]: https://doom.fandom.com/wiki/The_Plutonia_Experiment "The Plutonia Experiment — Doom Wiki"
[3]: https://doom.fandom.com/wiki/TNT:_Evilution "TNT: Evilution — Doom Wiki"
[4]: https://github.com/Blasphemer/blasphemer "Blasphemer repository"
[5]: https://github.com/XProger/OpenResident "XProger/OpenResident repository"
A direct catalog-click check confirmed that the `Open WebGL2 probe` action navigates to `openresident.html`. The subsequent local page stayed in its loading state only because the deliberately untracked local build output had been removed during repository cleanup; the workflow is responsible for generating that directory in a real deployment. The build output is staged again below solely for final local flow verification and will be removed before commit.
With the CI-like local build output restored, the full catalog-to-probe flow passed: the local `Open WebGL2 probe` route rendered `PASS — WebGL2 renderer lifecycle initialised` and its console was empty. The temporary output directory is removed again before commit.
