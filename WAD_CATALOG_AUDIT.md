# ممیزی catalog، مجوز و سازگاری RIFTWAD

**دامنهٔ گزارش.** این catalog میان مجوز source code و اجازهٔ مستقل برای بازتوزیع WAD، map، texture، sprite و موسیقی تمایز می‌گذارد. عمومی‌بودن یک repository به‌تنهایی اجازهٔ bundle کردن محتوای بازی نیست. RIFTWAD فقط عنوانی را در build قرار می‌دهد که مسیر مجوز و منبع آن روشن باشد؛ سایر موارد یا به‌صورت فایل محلیِ مالک کاربر یا به‌شکل مطالعهٔ engine فهرست می‌شوند.

| عنوان | وضعیت catalog | وضعیت اجرا در RIFTWAD | مبنای مجوز / policy |
|---|---|---|---|
| Freedoom: Phase 1 | Bundled IWAD | قابل اجرا | محتوای آزاد Freedoom با attribution حفظ‌شده [1] |
| Freedoom: Phase 2 | Bundled IWAD | قابل اجرا | محتوای آزاد Freedoom با attribution حفظ‌شده [1] |
| FreeDM: Arena Archive | Bundled IWAD | قابل اجرا برای exploration محلی؛ بدون bot یا multiplayer | archive رسمی خانوادهٔ Freedoom با attribution حفظ‌شده [1] |
| Hacx: Twitch ’n Kill | Bundled Freedoom II + Hacx PWAD | قابل اجرا؛ مسیر Doom II/commercial runtime | release رسمی Hacx 1.2؛ royalty-free، غیرتجاری و همراه با credit/license [6] [7] |
| The Plutonia Experiment | Owned file | فقط پس از انتخاب WAD قانونی کاربر | Final Doom تجاری؛ هیچ archive یا dataای bundle نمی‌شود [2] |
| TNT: Evilution | Owned file | فقط پس از انتخاب WAD قانونی کاربر | Final Doom تجاری؛ هیچ archive یا dataای bundle نمی‌شود [3] |
| Community WAD shelf | Local import | یک IWAD و حداکثر سه PWAD محلی | حق استفاده و سازگاری بر عهدهٔ کاربر؛ فایل‌ها upload نمی‌شوند |
| Blasphemer | External engine | غیرقابل اجرا در runtime فعلی | محتوای آزاد برای engine خانوادهٔ Heretic است، نه Doom 1.10 [4] |
| OpenResident | WebGL2 study | فقط graphics probe؛ بازی نیست | source engine با BSD-2-Clause و بدون game data [5] |

## محدودیت سازگاری runtime

RIFTWAD فعلی یک browser build از **linuxdoom 1.10** با loader سازگار با WADهای Doom است. بنابراین نباید سازگاری با GZDoom/ZScript/UDMF، formatهای Heretic/Hexen یا total conversionهای مدرن را ادعا کند. Blasphemer با وجود وضعیت آزاد محتوا، به یک engine سازگار با Heretic نیاز دارد؛ به همین دلیل فقط به‌عنوان title خارجی و غیرقابل‌اجرا نمایش داده می‌شود [4].

| خانوادهٔ runtime | رفتار صادقانه در این build |
|---|---|
| Doom-compatible IWAD | Freedoom Phase 1، Phase 2 و FreeDM bundle و قابل launch هستند. Hacx 1.2 به‌صورت Hacx PWAD روی Freedoom II bundle می‌شود و فقط در deployment غیرتجاری مجاز است. |
| Doom-compatible PWAD | تنها همراه با IWAD محلی و پس از انتخاب کاربر قابل load است. |
| Heretic-compatible IWAD | در catalog می‌تواند معرفی شود، اما launch نمی‌شود. |
| GZDoom-era release | تا زمان ساخت adapter اختصاصی، قابل اجرا یا bundled معرفی نمی‌شود. |

## سیاست screenshot و attribution

هیچ artwork مولدی در catalog فعال وجود ندارد. چهار cover تولیدشدهٔ پیشین از repository حذف شده‌اند و همهٔ کارت‌ها از screenshot واقعی gameplay استفاده می‌کنند. attribution هر asset در `ASSETS.md` و در metadata همان card نگهداری می‌شود.

| Asset | منبع screenshot | credit نمایشی |
|---|---|---|
| `freedoom-phase1.png`، `freedoom-phase2.png` و `freedm.png` | پروژهٔ رسمی Freedoom [1] | Freedoom project |
| `hacx-gameplay.jpg` | صفحهٔ رسانهٔ رسمی Hacx [6] | Hacx project / Dr Nostromo |
| `plutonia-gateway-of-hell.webp` | Doom Wiki / Fandom، MAP30 [2] | Doom Wiki / Fandom |
| `tnt-steel-works.webp` | Doom Wiki / Fandom، MAP14 [3] | Doom Wiki / Fandom |
| `blasphemer-gameplay.webp` | image ارجاع‌شده در README پروژه [4] | Blasphemer project / jeshimoth.com |
| `openresident-gameplay.webp` | image ارجاع‌شده در README upstream [5] | XProger/OpenResident README |

## Hacx 1.2: مبنای bundle

Hacx 1.2 در منبع رسمی Dr Nostromo به‌عنوان یک **stand-alone IWAD** معرفی شده و به Doom II برای اجرا نیاز ندارد. با این حال، linuxdoom 1.10 فعلی Hacx را از مسیر Doom II/`MAP01` تشخیص می‌دهد؛ بنابراین RIFTWAD برای سازگاری، archive Hacx را به‌عنوان PWAD روی Freedoom Phase 2 (base IWAD bundleشده) لایه‌گذاری می‌کند. `HACX.TXT` در release، توزیع آزاد برای سایت‌ها را تصریح می‌کند، اما هرگونه درآمدزایی یا استفاده برای ترویج فعالیت درآمدزا را منع می‌کند. `LEGAL.txt` و `CREDITS.txt` upstream در artifact منتشرشدهٔ RIFTWAD کنار WAD و README release قرار می‌گیرند تا attribution و شرایط distribution همراه bundle بمانند. [6] [7]

> Hacx 1.2 فقط برای deploymentهای **غیرتجاری** RIFTWAD bundle می‌شود. در صورت اضافه‌شدن تبلیغ، فروش، subscription یا هر مدل درآمدزای دیگر، باید از artifact حذف شود یا اجازهٔ کتبی جداگانه اخذ گردد.

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
[6]: https://drnostromo.com/hacx/page.php?content=download "Hacx 1.2 official download"
[7]: https://github.com/XaserAcheron/hacx/blob/master/LEGAL.txt "Hacx distribution terms"