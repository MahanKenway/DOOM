# ممیزی catalog، مجوز و سازگاری RetroPlay

**دامنهٔ گزارش.** این catalog میان مجوز source code و اجازهٔ مستقل برای بازتوزیع WAD، map، texture، sprite و موسیقی تمایز می‌گذارد. عمومی‌بودن یک repository به‌تنهایی اجازهٔ bundle کردن محتوای بازی نیست. RetroPlay فقط عنوانی را در build قرار می‌دهد که مسیر مجوز و منبع آن روشن باشد؛ سایر موارد یا به‌صورت فایل محلیِ مالک کاربر یا به‌شکل مطالعهٔ engine فهرست می‌شوند.

| عنوان | وضعیت catalog | وضعیت اجرا در RetroPlay | مبنای مجوز / policy |
|---|---|---|---|
| Freedoom: Phase 1 | Bundled IWAD | قابل اجرا | محتوای آزاد Freedoom با attribution حفظ‌شده [1] |
| Freedoom: Phase 2 | Bundled IWAD | قابل اجرا | محتوای آزاد Freedoom با attribution حفظ‌شده [1] |
| FreeDM: Arena Archive | Bundled IWAD | قابل اجرا برای exploration محلی؛ بدون bot یا multiplayer | archive رسمی خانوادهٔ Freedoom با attribution حفظ‌شده [1] |
| Hacx: Twitch ’n Kill | Bundled Freedoom II + Hacx PWAD | قابل اجرا؛ مسیر Doom II/commercial runtime | release رسمی Hacx 1.2؛ royalty-free، غیرتجاری و همراه با credit/license [6] [7] |
| Ancient Aliens | External engine | نیازمند port سازگار Boom | download رسمی project؛ screenshot واقعی با credit، اما هیچ WADی bundle نمی‌شود [8] |
| Eviternity | External engine | نیازمند port سازگار Boom | download رسمی project؛ screenshot واقعی با credit، اما هیچ WADی bundle نمی‌شود [9] |
| Back to Saturn X: E1 | Official download | نیازمند دانلود دو PWAD و IWAD سازگار کاربر | project WADها bundle نمی‌شوند؛ مسیر canonical فقط معرفی می‌شود [10] |
| The Adventures of Square | External engine | بستهٔ modified GZDoom رسمی | total conversion با package اختصاصی؛ فقط به release رسمی وصل می‌شود [11] |
| The Plutonia Experiment | Owned file | فقط پس از انتخاب WAD قانونی کاربر | Final Doom تجاری؛ هیچ archive یا dataای bundle نمی‌شود [2] |
| TNT: Evilution | Owned file | فقط پس از انتخاب WAD قانونی کاربر | Final Doom تجاری؛ هیچ archive یا dataای bundle نمی‌شود [3] |
| Community WAD shelf | Local import | یک IWAD و حداکثر سه PWAD محلی | حق استفاده و سازگاری بر عهدهٔ کاربر؛ فایل‌ها upload نمی‌شوند |
| Blasphemer | External engine | غیرقابل اجرا در runtime فعلی | محتوای آزاد برای engine خانوادهٔ Heretic است، نه Doom 1.10 [4] |
| C-Dogs SDL | Bundled independent runtime | قابل اجرا در صفحه و WebAssembly جداگانه | code تحت GPL-2.0 و دادهٔ آزاد upstream؛ فقط برای deployment غیرتجاری RetroPlay و با attribution حفظ‌شده [12] |
| OpenResident | WebGL2 study | فقط graphics probe؛ بازی نیست | source engine با BSD-2-Clause و بدون game data [5] |

## محدودیت سازگاری runtime

RetroPlay فعلی یک browser build از **linuxdoom 1.10** با loader سازگار با WADهای Doom است. بنابراین نباید سازگاری با GZDoom/ZScript/UDMF، formatهای Heretic/Hexen یا total conversionهای مدرن را ادعا کند. Blasphemer با وجود وضعیت آزاد محتوا، به یک engine سازگار با Heretic نیاز دارد؛ به همین دلیل فقط به‌عنوان title خارجی و غیرقابل‌اجرا نمایش داده می‌شود [4].

| خانوادهٔ runtime | رفتار صادقانه در این build |
|---|---|
| Doom-compatible IWAD | Freedoom Phase 1، Phase 2 و FreeDM bundle و قابل launch هستند. Hacx 1.2 به‌صورت Hacx PWAD روی Freedoom II bundle می‌شود و فقط در deployment غیرتجاری مجاز است. |
| Doom-compatible PWAD | تنها همراه با IWAD محلی و پس از انتخاب کاربر قابل load است. |
| Boom / MBF21 PWAD | در catalog معرفی می‌شود اما تا زمان ارتقای engine، launch یا bundle نمی‌شود. |
| GZDoom total conversion | تنها با پیوند release رسمی نمایش داده می‌شود؛ package یا asset آن host نمی‌شود. |
| Heretic-compatible IWAD | در catalog می‌تواند معرفی شود، اما launch نمی‌شود. |
| GZDoom-era release | تا زمان ساخت adapter اختصاصی، قابل اجرا یا bundled معرفی نمی‌شود. |
| C-Dogs SDL native runtime | در صفحهٔ `cdogs.html` و با ماژول WASM، filesystem و input مستقل اجرا می‌شود؛ هیچ WAD، state یا loopی با Doom اشتراک ندارد. |

## سیاست screenshot و attribution

هیچ artwork مولدی در catalog فعال وجود ندارد. چهار cover تولیدشدهٔ پیشین از repository حذف شده‌اند و همهٔ کارت‌ها از screenshot واقعی gameplay استفاده می‌کنند. attribution هر asset در `ASSETS.md` و در metadata همان card نگهداری می‌شود.

| Asset | منبع screenshot | credit نمایشی |
|---|---|---|
| `freedoom-phase1.png`، `freedoom-phase2.png` و `freedm.png` | پروژهٔ رسمی Freedoom [1] | Freedoom project |
| `hacx-gameplay.jpg` | صفحهٔ رسانهٔ رسمی Hacx [6] | Hacx project / Dr Nostromo |
| `ancient-aliens-gameplay.jpg` | صفحهٔ انتشار Ancient Aliens در ModDB [8] | Ancient Aliens project / ModDB |
| `eviternity-gameplay.jpg` | صفحهٔ انتشار Eviternity در ModDB [9] | Eviternity project / ModDB |
| `back-to-saturn-x-gameplay.jpg` | صفحهٔ انتشار Back to Saturn X در ModDB [10] | Back to Saturn X project / ModDB |
| `adventures-of-square-gameplay.png` | Square press kit رسمی [11] | BigBrik Games / Square press kit |
| `plutonia-gateway-of-hell.webp` | Doom Wiki / Fandom، MAP30 [2] | Doom Wiki / Fandom |
| `tnt-steel-works.webp` | Doom Wiki / Fandom، MAP14 [3] | Doom Wiki / Fandom |
| `blasphemer-gameplay.webp` | image ارجاع‌شده در README پروژه [4] | Blasphemer project / jeshimoth.com |
| `openresident-gameplay.webp` | image ارجاع‌شده در README upstream [5] | XProger/OpenResident README |
| `cdogs-sdl-browser.png` | screenshot واقعی runtime C-Dogs در Chromium | RetroPlay C-Dogs SDL WebAssembly runtime |

## Hacx 1.2: مبنای bundle

Hacx 1.2 در منبع رسمی Dr Nostromo به‌عنوان یک **stand-alone IWAD** معرفی شده و به Doom II برای اجرا نیاز ندارد. با این حال، linuxdoom 1.10 فعلی Hacx را از مسیر Doom II/`MAP01` تشخیص می‌دهد؛ بنابراین RetroPlay برای سازگاری، archive Hacx را به‌عنوان PWAD روی Freedoom Phase 2 (base IWAD bundleشده) لایه‌گذاری می‌کند. `HACX.TXT` در release، توزیع آزاد برای سایت‌ها را تصریح می‌کند، اما هرگونه درآمدزایی یا استفاده برای ترویج فعالیت درآمدزا را منع می‌کند. `LEGAL.txt` و `CREDITS.txt` upstream در artifact منتشرشدهٔ RetroPlay کنار WAD و README release قرار می‌گیرند تا attribution و شرایط distribution همراه bundle بمانند. Archive رسمی `hacx12.zip` با SHA-256 `70d25e8f4b48906759db32213927859a99b3b045d3291d468357b225d64cbf8b` در `third_party/hacx/` نگهداری و در CI پیش از استخراج verify می‌شود؛ این کار deploy را از کندی host خارجی مستقل می‌کند. [6] [7]

> Hacx 1.2 فقط برای deploymentهای **غیرتجاری** RetroPlay bundle می‌شود. در صورت اضافه‌شدن تبلیغ، فروش، subscription یا هر مدل درآمدزای دیگر، باید از artifact حذف شود یا اجازهٔ کتبی جداگانه اخذ گردد.

## OpenResident: نتیجهٔ prototype WebAssembly

> **نتیجه:** تبدیل فنی به WebAssembly/WebGL2 ممکن است، اما این نتیجه به‌معنای قابل‌بازی‌بودن Resident Evil در RetroPlay نیست.

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
| smoke test `scripts/validate-retroplay.sh` | PASS |
| C-Dogs SDL fresh-clone Emscripten build | PASS؛ source pinned در `bb7e16ce765610d705f7c3e190ddcd4a81f3b371`، patch browser و archive آزاد تولید شد |
| C-Dogs SDL Chromium runtime | PASS؛ canvas رنگی، منوی Start/Options، campaign و dogfight directoryها و status READY مشاهده شد |

## منابع

[1]: https://github.com/freedoom/freedoom "Freedoom repository"
[2]: https://doom.fandom.com/wiki/The_Plutonia_Experiment "The Plutonia Experiment — Doom Wiki"
[3]: https://doom.fandom.com/wiki/TNT:_Evilution "TNT: Evilution — Doom Wiki"
[4]: https://github.com/Blasphemer/blasphemer "Blasphemer repository"
[5]: https://github.com/XProger/OpenResident "XProger/OpenResident repository"
[6]: https://drnostromo.com/hacx/page.php?content=download "Hacx 1.2 official download"
[7]: https://github.com/XaserAcheron/hacx/blob/master/LEGAL.txt "Hacx distribution terms"
[8]: https://www.moddb.com/games/doom-ii/addons/ancient-aliens "Ancient Aliens v1.2"
[9]: https://www.moddb.com/mods/eviternity "Eviternity"
[10]: https://www.moddb.com/mods/back-to-saturn-x "Back to Saturn X"
[11]: http://adventuresofsquare.com/ "The Adventures of Square"
[12]: https://github.com/cxong/cdogs-sdl "C-Dogs SDL upstream repository"
