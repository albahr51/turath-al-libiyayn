# مجموع أعمال الشيخين

موقع إلكتروني يعرض مجموع أعمال الشيخين الشهيدين — **أبي يحيى الليبي** و**عطية الله الليبي** رحمهما الله — بمحتوى نصّي قابل للبحث، مع صفحات سيرة، مكتبة صوتية/مرئية، وتحميل الكتب PDF وWord.

مبني بـ [Astro](https://astro.build) ومستضاف على [Cloudflare Pages](https://pages.cloudflare.com) (المجال: `turath-al-libiyayn.pages.dev`).

## المميزات

- أكثر من 1000 مبحث نصّي لكتابَي الشيخين، منسق مع الفهارس والترقيم.
- بحث فوري مبني على فهرس `public/search/search-index.json` (يُولَّد أثناء البناء).
- مشغّل صوت/فيديو مبني على [Plyr](https://plyr.io) لصفحة الصوتيات والمرئيات.
- وسائط كبيرة تُستضاف على GitHub Releases وتُقدَّم عبر دالة `media-proxy` على Cloudflare (تدعم `Range` للتشغيل المباشر).
- تحميل كل كتاب PDF كاملًا، ومقاطع PDF مفردة لكل مبحث (`public/media/extracted/…`).
- توجيهات `public/_redirects` لربط مسارات الوسائط القديمة بالملفات المستضافة.
- خرائط صفحات وحفظ تقدم القراءة لكل كتاب.
- نسخ PDF «جاهزة للطباعة» (`/book/<author>/print/<id>`).

## هيكل المشروع

```text
/
├── src/
│   ├── content/books/      # محتوى الكتب Markdown (abu-yahya / atiyatullah)
│   ├── pages/              # الصفحات (الرئيسية، السيرة، الكتب، الصوتيات)
│   └── layouts/            # Layout مشترك
├── public/
│   ├── media/              # أغلفة وصور وملفات PDF
│   │   └── extracted/      # PDF مفرد لكل مبحث
│   ├── search/             # فهرس البحث (يُولَّد)
│   ├── _redirects          # توجيهات الوسائط
│   └── robots.txt
├── functions/media-proxy/  # دالة Cloudflare لتقديم الوسائط من GitHub Releases
├── scripts/
│   ├── build-search-db.mjs # توليد فهرس البحث من المحتوى
│   └── cleanup-media.mjs   # حذف الوسائط الأكبر من 25MB من ناتج البناء
└── astro.config.mjs
```

## الأوامر

| الأمر | الوظيفة |
| :--- | :--- |
| `npm install` | تثبيت الاعتماديات |
| `npm run dev` | تشغيل خادم التطوير محليًا |
| `npm run build` | توليد فهرس البحث ثم البناء ثم تنظيف الوسائط الضخمة إلى `dist/` |
| `npm run preview` | معاينة ناتج البناء محليًا |
| `npx wrangler pages deploy dist` | النشر على Cloudflare Pages |

## ملاحظات النشر

- بسبب حد Cloudflare Pages البالغ 25MB لكل ملف، سكربت `cleanup-media.mjs` يحذف الوسائط الأكبر من ذلك من `dist/` بعد البناء.
- الوسائط الكبيرة (صوت/فيديو/PDF) تُستضاف على [albahr51/turath-media](https://github.com/albahr51/turath-media) Releases وتُقدَّم عبر `functions/media-proxy/[[path]].js`.
- `public/_redirects` يحتوي توجيهات 302 للمسارات القديمة إلى `media-proxy`.
