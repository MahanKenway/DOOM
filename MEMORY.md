# یادداشت‌های اجرایی RetroPlay

- اجرای Freedoom در نسخهٔ منتشرشده با WASM فعال است و باید بدون تغییر در contractهای loading/game حفظ شود.
- پشتیبانی چند-WAD به یک IWAD پایه و حداکثر سه PWAD متکی است؛ تشخیص محتوا با هدر `IWAD`/`PWAD` انجام می‌شود.
- نام‌های DOM منتخب برای جریان runtime نباید حذف شوند: `wad-picker`، `btn-freedoom`، `wad-upload`، `wad-drop-zone`، `loading-screen` و `game-screen`.
- مشکل virtual `WEBWAD0` و توقف AudioContext قبلاً برطرف شده‌اند؛ بازطراحی باید فقط پوسته و تعامل‌های catalog را تغییر دهد.
- تصویر مرجع user ترکیبی از پنل‌های شناور نیمه‌شفاف، grid فضای مهندسی و hierarchy لایه‌ای بود. تصویر تولیدشده در `/home/ubuntu/retroplay_visual_target.png` anchor مکمل همین جهت است.

- آزمون مرورگر محلی انجام شد: boot جدید، هدر، پنل featured، چهار کارت catalog، فیلترها، جست‌وجو، واردگر WAD و Library همگی در DOM و صفحهٔ اجراشده حاضر شدند. مسیر تصویر hero در HTML هنوز به `freedoom-rift.jpg` اشاره می‌کرد، در حالی که خروجی نهایی PNG است؛ این یک اصلاح فوری پیش از آزمون مجدد است.

- بررسی بصریِ نسخهٔ محلی پس از اصلاح hero موفق بود. صفحه با زمینهٔ off-white/grid، هدر مینیمال، پنل featured دوقسمتی، accent lime و نوار collectionها طبق جهت PSP-الهام نمایش داده شد. کاور featured و چهار کاور catalog اکنون به فایل‌های PNG معتبر اشاره می‌کنند.

- تعامل‌های catalog در مرورگر محلی تأیید شدند: انتخاب Horror، catalog را به یک record فیلتر کرد و افزودن Midnight Signal به Library، شمارنده را به 01 رساند و همان کارت را در بخش Personal library نمایش داد. دادهٔ library در localStorage نگهداری می‌شود.

- برای آزمون end-to-end، یک نسخهٔ موقت Freedoom WAD در workspace محلی قرار گرفت؛ این فایل فقط برای بررسی local استفاده می‌شود و پیش از commit حذف خواهد شد. هاب پس از refresh با assets نهایی و مسیر featured صحیح رندر شد.

- برای تکمیل آزمون local، artifact WASM منتشرشده نیز موقتاً به workspace افزوده شد. این دو artifact فقط برای بررسی هستند و قبل از commit حذف می‌شوند؛ workflow GitHub هر دو را در زمان build تولید/دریافت می‌کند.

- آزمون end-to-end کامل موفق بود: Launch featured از هاب جدید، Freedoom را با WAD و WASM فعال اجرا کرد و game screen با 12 FPS نمایش داده شد. کنترل ← RetroPlay نیز موتور را dispose کرد و کاربر را به هاب بازگرداند. این چرخه با artifactهای build موقت محلی آزمایش شد.

- آزمون catalog توسعه: Freedoom Phase 1، Freedoom Phase 2 و FreeDM به‌عنوان آثار آزاد bundled با اسکرین‌شات و attribution نمایش داده شدند. Plutonia و TNT با برچسب Commercial IWAD و Requires legal IWAD نمایش داده شدند و مسیر Attach WAD دریافت کردند؛ هیچ فایل تجاری در build بسته‌بندی نشد.

- smoke test persistence با mock localStorage موفق بود: bytes save بدون تغییر بازیابی شدند، metadata slot ثبت شد و export/import bundle یک slot را بازگرداند. بررسی archive رسمی Freedoom 0.13 نیز تأیید کرد که فقط freedoom1.wad و freedoom2.wad در همان بسته هستند؛ FreeDM برای جلوگیری از build معیوب bundled نشد و به مسیر attach آزاد منتقل شد.

- تست browser persistence مقدار master volume، deadzone و battery mode را در localStorage نسخه‌دار بازیابی کرد. بررسی view نشان داد module catalog به‌علت cache مرورگر هنوز نسخهٔ قبل از تغییر FreeDM را نمایش می‌دهد؛ برای تأیید نهایی با query cache-bust بازخوانی می‌شود.
