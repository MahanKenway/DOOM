# ساختار RIFTWAD

| لایه | مسئولیت | فایل‌ها |
|---|---|---|
| App shell | semantic markup، نمای هاب، loading و game canvas | `index.html` |
| Visual system | grid، پنل‌های spatial، responsive layout و game overlay | `styles/main.css` |
| Catalog state | دادهٔ بازی‌ها، فیلتر، جست‌وجو، library محلی و رویدادهای launch/import | `src/catalog.js` |
| Application orchestration | دریافت WAD، اعتبارسنجی IWAD/PWAD، ساخت موتور و transition صفحات | `src/main.js` |
| Runtime | WebAssembly، input، renderer و audio | `src/engine/*` |

## مدل حالت

`hub` حالت پیش‌فرض است. کاربر می‌تواند یک بازی bundled را اجرا کند، یک مورد catalog را برای افزودن به Library pin کند یا از Bring Your Own WAD واردگر فایل را باز کند. پس از دریافت فایل معتبر، برنامه به `loading` و سپس `game` می‌رود. restart بازی، موتور را dispose می‌کند و هاب را برمی‌گرداند.

## قراردادهای رابط

شناسه‌های `loading-screen`، `wad-picker`، `game-screen`، `btn-freedoom`، `wad-upload` و `wad-drop-zone` حفظ می‌شوند تا جریان WASM بدون تغییر در C runtime برقرار بماند. `CatalogController` تنها از callbackهای `onPlayFreedoom` و `onImportWad` استفاده می‌کند؛ بنابراین catalog به DoomEngine وابسته نیست.

## Asset hints

کاورهای catalog صرفاً تصویری هستند و متن‌های محصول در HTML/CSS رندر می‌شوند تا خوانایی و accessibility حفظ شود. تصویر مرجع تولیدشده فقط نقش anchor بصری دارد؛ پنل‌ها و grid با CSS پیاده‌سازی می‌شوند تا responsive، دقیق و قابل نگهداری باشند.
