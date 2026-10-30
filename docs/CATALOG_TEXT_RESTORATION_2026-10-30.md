# Восстановление исходного текста каталога — 2026-10-30

Последнее прямое решение владельца требует полного воспроизведения RU/RO-оригиналов drnona.md с единственным изменением содержания: удалением эмодзи. Оно имеет приоритет перед прежним скрытием целых товарных полей из-за pending claims. Статусы claims и редакционной проверки не повышаются; производство остаётся release-blocked. Старое одобрение 2026-10-05 относится к прежним текстам, его fingerprints не обновлялись автоматически. P0-LOCALE открыт заново.

Владелец модуля: `/ru/product/:slug`, `/ro/product/:slug`, `src/pages/ProductPage.tsx`. Постоянные данные: JSON в `src/data`, без базы или CRM. Путь: динамический обход категорий → страницы оригиналов → `sourceBlocks` и `longDescription` → проверенная генерация публичных проекций → семантические абзацы/списки. Claims хранятся отдельно. Связанные проверки: source parser, claims, Romanian approval, projections, полная RU/RO browser-сверка и общий e2e.

Источник состава и применения — только текст drnona.md. Если отдельного раздела нет, значение остаётся null; произвольные переводы и шаблоны не создаются. Сведения о SKU и прежние имена сохраняются как идентификационные метаданные; актуальность SKU на drnona.com в этой работе не перепроверялась. drnona.com не запрашивается импортёром и не заменяет описание.

Скриншоты пользователя в чате отсутствуют. OKSEEN и DND сверяются отдельно с исходными RU/RO HTML-страницами и новыми desktop/mobile страницами. Приложенные скриншоты: NOT VERIFIED.

Сверка выполнена с реально отрисованным DOM собранного Vite-сайта. Количество товаров не использовалось как доказательство полноты. Для каждого оригинала независимо извлечён текст из исходного HTML (без вызова структурного парсера импортёра) и посимвольно сопоставлен с полным видимым описанием после разрешённых преобразований. Дополнительно проверены порядок блоков/пунктов, отсутствие обрезки и ширина области чтения. Необъяснённых потерь текста: 0.

OKSEEN RU/RO: сохранены вступление, 3 пункта ингредиентов, 4 пункта свойств и заключительный абзац. DND RU/RO: сохранены вступительные абзацы, 98%, 45 секунд, 7 пунктов состава, 6 пунктов свойств и все заключительные абзацы. Заключения не включены в списки. Собственные снимки desktop/mobile сохранены локально в `artifacts/catalog-transfer/`; пользовательских приложенных снимков нет.

Проверки на Node 22.23.1 / npm 10.9.8:

| Проверка | Результат |
|---|---|
| repository:validate | PASS |
| architecture:validate | PASS |
| typecheck | PASS |
| lint | PASS |
| test | PASS: 33 файла, 227 тестов |
| build | PASS: 196 prerendered routes; SEO, security и performance gates пройдены |
| source → rendered DOM | PASS: 100 оригиналов × desktop 1440 px / mobile 390 px = 200 сравнений; дополнительно RO проверен на 320 px |
| Повторный импорт | PASS: байтовое совпадение RU/RO JSON, manifest и статусов review |
| graphify:cross-repo | PASS; объединённый граф обновлён. Инструмент сохраняет прежние schema warnings о source_file/label/confidence; это не проверка медицинских утверждений |
| release:check | EXPECTED BLOCKED: 7 открытых P0/P1; 433 claims остаются pending, 0 approved |
| Общий test:e2e | Выполнен; полный PASS не заявляется. Старые товарные ожидания обновлены под дословный перенос и перепроверены. Сохранились перечисленные ниже независимые сбои каталога |

Оставшиеся сбои e2e воспроизведены в отдельном checkout исходного `c8e10ed`, до изменений этой задачи:

- `catalog.spec.ts`: ожидает 28 подписей объёма; исходный и текущий каталог выводят 50.
- Эталон каталога 320 px: ожидается высота 22540 px, фактически 23146 px; в исходном и текущем checkout одинаковые 755763 отличающихся пикселя. Эталон не перезаписывался.
- Responsive contract 375 px, `catalog-long-ro`: одинаковое пересечение двух button с `a.button.button--primary` в исходном и текущем checkout. Остальные последовательные проверки матрицы после этого сбоя пропускаются самим Playwright.

Полный первый прогон e2e: 414 passed, 17 failed, 24 skipped, 13 did not run; значительная часть ошибок — устаревшие ожидания скрытых товарных описаний. После исправления ожиданий повторная проверка этих сценариев дала 12/14 PASS, оставшиеся два RO-сценария исправлены и прошли в следующем прогоне. Финальный целевой прогон: все 4 RU/RO теста полноты блоков и оба RO-сценария локализации PASS; в матрице остаётся описанный исходный сбой 375 px. Логи первого прогона, повторных проверок и исходного checkout находятся только в игнорируемых `artifacts/`.

Повторение: `npm run sync:catalog:md:write` заново обходит live-категории и все оригиналы. Незнакомые товары, недоступные источники и несопоставленные RO-ссылки приводят к явной ошибке до записи данных. `node scripts/verify-catalog-transfer.mjs --write-report` сверяет свежие HTTP-оригиналы с запущенным локальным сайтом; `--source-cache` использует HTML, собранный live-импортом, а `CATALOG_VERIFY_URL` задаёт адрес собранного preview. Таблица ниже относится к фактически проверенным оригиналам; неперенесённых фрагментов и недоступных RU/RO-оригиналов нет.



<!-- comparison-table -->

Проверено 30.10.2026, 12:01:34 МСК: 100 исходных текстов, 200 сравнений с реально отрисованным DOM. Допустимые различия: эмодзи удалены, маркеры заменены HTML-списками, пробелы нормализованы. Исходные HTML получены при полном live-обходе в этой сессии. Источники недоступны: 0. Ошибки сравнения: 0.

| Товар / язык / SKU | URL источника | Новая страница | Полнота переноса | Оставшиеся расхождения |
|---|---|---|---|---|
| Eau De Parfume ( LORD ) (RO; 310001) | https://www.drnona.md/parfume_lord_ro | /ro/product/after-shave-lord | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Eau De Parfume ( LORD ) (RU; 310001) | https://www.drnona.md/parfume_lord | /ru/product/after-shave-lord | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Anti-Aging Serum (RO; 439001) | https://www.drnona.md/anti_aging_serum_ro | /ro/product/anti-aging-serum | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Anti-Aging Serum (RU; 439001) | https://www.drnona.md/anti_aging_serum | /ru/product/anti-aging-serum | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Moisturizing Cream / For Face (RO; 606001) | https://www.drnona.md/ard_cream_for_face_ro | /ro/product/ard-complex | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Moisturizing Cream / For Face (RU; 606001) | https://www.drnona.md/ard_cream_for_face | /ru/product/ard-complex | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Recovering Mud Musk (RO; 403001) | https://www.drnona.md/recovering_mud_musk_ro | /ro/product/beauty-mask-for-face | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Recovering Mud Musk (RU; 403001) | https://www.drnona.md/recovering_mud_musk | /ru/product/beauty-mask-for-face | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Shea Body Butter (RO; SKU NOT VERIFIED) | https://www.drnona.md/body_butter_ro | /ro/product/body-butter | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Shea Body Butter (RU; SKU NOT VERIFIED) | https://www.drnona.md/body_butter | /ru/product/body-butter | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Chocoseen (RO; 252001) | https://www.drnona.md/chocoseen_ro | /ro/product/chocoseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Chocoseen (RU; 252001) | https://www.drnona.md/chocoseen | /ru/product/chocoseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| CLEANSEEN (RO; 208001) | https://www.drnona.md/cleanseen_ro | /ro/product/cleanseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| CLEANSEEN (RU; 208001) | https://www.drnona.md/cleanseen | /ru/product/cleanseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Slimseen Coffee Mix (RO; 700001) | https://www.drnona.md/slimseen_coffee_mix_ro | /ro/product/coffee-mix | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Slimseen Coffee Mix (RU; 700001) | https://www.drnona.md/slimseen_coffee_mix | /ru/product/coffee-mix | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Mineral Hair Conditioner (RO; 440001) | https://www.drnona.md/mineral_hair_conditioner_ro | /ro/product/conditioner | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Mineral Hair Conditioner (RU; 440001) | https://www.drnona.md/mineral_hair_conditioner | /ru/product/conditioner | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Compressed Wipes (RO; 450001) | https://www.drnona.md/compressed_wipes_ro | /ro/product/dead-sea-water-compresses | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Compressed Wipes (RU; 450001) | https://www.drnona.md/compressed_wipes_ru | /ru/product/dead-sea-water-compresses | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| DND (RO; 601001) | https://www.drnona.md/dnd_ro | /ro/product/dnd-chewing-gum-tablets | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| DND (RU; 601001) | https://www.drnona.md/dnd | /ru/product/dnd-chewing-gum-tablets | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Dynamic Cream (RO; 404001) | https://www.drnona.md/dynamic_ro | /ro/product/dynamic-hydrating-cream | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Dynamic Cream (RU; 404001) | https://www.drnona.md/dynamic | /ru/product/dynamic-hydrating-cream | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Eye Care Balm (RO; 405001) | https://www.drnona.md/eye_care_balm_ro | /ro/product/eye-contour-balm | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Eye Care Balm (RU; 405001) | https://www.drnona.md/eye_care_balm | /ru/product/eye-contour-balm | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Face Milk (RO; 414001) | https://www.drnona.md/face_milk_ro | /ro/product/face-milk | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Face Milk (RU; 414001) | https://www.drnona.md/face_milk | /ru/product/face-milk | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Facial Foam Soap (RO; 510001) | https://www.drnona.md/facial_foam_soap_ro | /ro/product/face-soap | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Facial Foam Soap (RU; 510001) | https://www.drnona.md/facial_foam_soap | /ru/product/face-soap | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Solaris Facial Cream (RO; 410001) | https://www.drnona.md/facial_solaris_ro | /ro/product/facial-solaris | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Solaris Facial Cream (RU; 410001) | https://www.drnona.md/facial_solaris | /ru/product/facial-solaris | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| PHASE-9 (RO; 205101) | https://www.drnona.md/phase_9_ro | /ro/product/fase-9 | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| PHASE-9 (RU; 205101) | https://www.drnona.md/phase_9 | /ru/product/fase-9 | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| FEMSEEN (RO; 210001) | https://www.drnona.md/femseen_ro | /ro/product/femseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| FEMSEEN (RU; 210001) | https://www.drnona.md/femseen | /ru/product/femseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Mineral Shampoo (RO; 461001) | https://www.drnona.md/mineral_shampoo_ro | /ro/product/frequent-use-tonic-shampoo | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Mineral Shampoo (RU; 461001) | https://www.drnona.md/mineral_shampoo | /ru/product/frequent-use-tonic-shampoo | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| GOLDSEEN (RO; 212001) | https://www.drnona.md/goldseen_ro | /ro/product/goldseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| GOLDSEEN (RU; 212001) | https://www.drnona.md/goldseen | /ru/product/goldseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Gonseen Tea (RO; 230001) | https://www.drnona.md/gonseen_ro | /ro/product/gonseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Gonseen Tea (RU; 230001) | https://www.drnona.md/gonseen | /ru/product/gonseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Shower Gel (RO; 415001) | https://www.drnona.md/shower_gel_ro | /ro/product/halo-gel | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Shower Gel (RU; 415001) | https://www.drnona.md/shower_gel | /ru/product/halo-gel | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Unisex Deodorant Stick (RO; 325001) | https://www.drnona.md/unisex_deodorant_stick_ro | /ro/product/halo-pure-unisex-deodorant-stick | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Unisex Deodorant Stick (RU; 325001) | https://www.drnona.md/unisex_deodorant_stick | /ru/product/halo-pure-unisex-deodorant-stick | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Shenseen Mousse Toothpaste (RO; 437001) | https://www.drnona.md/shenseen_mousse_toothpaste_ro | /ro/product/halo-shenseen-toothpaste | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Shenseen Mousse Toothpaste (RU; 437001) | https://www.drnona.md/shenseen_mousse_toothpaste | /ru/product/halo-shenseen-toothpaste | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Hand and Nail Cream (RO; 406001) | https://www.drnona.md/hand_and_nail_cream_ro | /ro/product/hand-and-nail-treatment | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Hand and Nail Cream (RU; 406001) | https://www.drnona.md/hand_and_nail_cream | /ru/product/hand-and-nail-treatment | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| IMUNSEEN (RO; 216001) | https://www.drnona.md/imunseen_ro | /ro/product/imunseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| IMUNSEEN (RU; 216001) | https://www.drnona.md/imunseen | /ru/product/imunseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Deodorant ( KIWI ) (RO; 321001) | https://www.drnona.md/deodorant_kiwi_ro | /ro/product/kiwi-deodorant | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Deodorant ( KIWI ) (RU; 321001) | https://www.drnona.md/deodorant_kiwi | /ru/product/kiwi-deodorant | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Deodorant ( LADY ) (RO; 320001) | https://www.drnona.md/deodorant_lady_ro | /ro/product/lady-deodorant | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Deodorant ( LADY ) (RU; 320001) | https://www.drnona.md/deodorant_lady | /ru/product/lady-deodorant | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Mineral Lipstick (RO; 330101) | https://www.drnona.md/mineral_lipstick_ro | /ro/product/lipstick-new | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Mineral Lipstick (RU; 330101) | https://www.drnona.md/mineral_lipstick | /ru/product/lipstick-new | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Deodorant ( LORD ) (RO; 324001) | https://www.drnona.md/deodorant_lord_ro | /ro/product/lord-deodorant | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Deodorant ( LORD ) (RU; 324001) | https://www.drnona.md/deodorant_lord | /ru/product/lord-deodorant | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Multi Mouthwash (RO; 412001) | https://www.drnona.md/mouthwash_ro | /ro/product/mouthwash | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Multi Mouthwash (RU; 412001) | https://www.drnona.md/mouthwash | /ru/product/mouthwash | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| NEWSEEN (RO; 213001) | https://www.drnona.md/newseen_ro | /ro/product/newseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| NEWSEEN (RU; 213001) | https://www.drnona.md/newseen | /ru/product/newseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Night Cream (RO; 409001) | https://www.drnona.md/night_cream_ro | /ro/product/night-cream | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Night Cream (RU; 409001) | https://www.drnona.md/night_cream | /ru/product/night-cream | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| OKSEEN (RO; 204001) | https://www.drnona.md/okseen_ro | /ro/product/okseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| OKSEEN (RU; 204001) | https://www.drnona.md/okseen | /ru/product/okseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Eau De Parfume ( FAYA ) (RO; 309001) | https://www.drnona.md/parfume_faya_ro | /ro/product/parfum-faya | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Eau De Parfume ( FAYA ) (RU; 309001) | https://www.drnona.md/parfume_faya | /ru/product/parfum-faya | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Eau De Parfume ( KIWI ) (RO; 302001) | https://www.drnona.md/parfume_kiwi_ro | /ro/product/perfume-kiwi | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Eau De Parfume ( KIWI ) (RU; 302001) | https://www.drnona.md/parfume_kiwi | /ru/product/perfume-kiwi | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Eau De Parfume ( LADY ) (RO; 301001) | https://www.drnona.md/parfume_lady_ro | /ro/product/perfume-lady | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Eau De Parfume ( LADY ) (RU; 301001) | https://www.drnona.md/parfume_lady | /ru/product/perfume-lady | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| PULMOSEEN (RO; 206001) | https://www.drnona.md/pulmoseen_ro | /ro/product/pulmoseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| PULMOSEEN (RU; 206001) | https://www.drnona.md/pulmoseen | /ru/product/pulmoseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| RAVSEEN (RO; 203001) | https://www.drnona.md/ravseen_ro | /ro/product/ravseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| RAVSEEN (RU; 203001) | https://www.drnona.md/ravseen | /ru/product/ravseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| REUMOSEEN (RO; 207001) | https://www.drnona.md/reumoseen_ro | /ro/product/reumoseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| REUMOSEEN (RU; 207001) | https://www.drnona.md/reumoseen | /ru/product/reumoseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Bath Salts with Camomile extract (RO; 451153) | https://www.drnona.md/bath_salts_with_chamomile_extract_ro | /ro/product/salts-camomile | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Bath Salts with Camomile extract (RU; 451153) | https://www.drnona.md/bath_salts_with_chamomile_extract | /ru/product/salts-camomile | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Bath Salts with Lavander extract (RO; 451154) | https://www.drnona.md/bath_salts_with_lavander_extract_ro | /ro/product/salts-lavander | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Bath Salts with Lavander extract (RU; 451154) | https://www.drnona.md/bath_salts_with_lavender_extract | /ru/product/salts-lavander | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Bath Salts with Rosemary, Eucalyptus & Thyme extract (RO; 451155) | https://www.drnona.md/bath_salts_with_rosemary_extract_ro | /ro/product/salts-rosemary | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Bath Salts with Rosemary, Eucalyptus & Thyme extract (RU; 451155) | https://www.drnona.md/bath_salts_with_rosemary_extract | /ru/product/salts-rosemary | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Bath Salts with Ylang Ylang, Patchouli & Anis Star Extract (RO; 451156) | https://www.drnona.md/bath_salts_with_ylang_ylang_extract_ro | /ro/product/salts-ylangylang | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Bath Salts with Ylang Ylang, Patchouli & Anis Star Extract (RU; 451156) | https://www.drnona.md/bath_salts_with_ylang_ylang_extract | /ru/product/salts-ylangylang | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Top Samples Kit (RO; 490001) | https://www.drnona.md/top_samples_kit_ro | /ro/product/samples-kit | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Top Samples Kit (RU; 490001) | https://www.drnona.md/top_samples_kit | /ru/product/samples-kit | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Shower Gel ( LORD ) (RO; SKU NOT VERIFIED) | https://www.drnona.md/shower_gel_lord_ro | /ro/product/shower-gel-lord | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Shower Gel ( LORD ) (RU; SKU NOT VERIFIED) | https://www.drnona.md/shower_gel_lord | /ru/product/shower-gel-lord | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Day Time Face Cream (RO; 602001) | https://www.drnona.md/shp_day_time_face_cream_ro | /ro/product/shp-day-time-face-cream-lc | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Day Time Face Cream (RU; 602001) | https://www.drnona.md/shp_day_time_face_cream | /ru/product/shp-day-time-face-cream-lc | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Solaris Body Lotion (RO; 413001) | https://www.drnona.md/solaris_ro | /ro/product/solaris-body-lotion | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Solaris Body Lotion (RU; 413001) | https://www.drnona.md/solaris | /ru/product/solaris-body-lotion | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Soupseen (RO; 231001) | https://www.drnona.md/soupseen_ro | /ro/product/soupseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| Soupseen (RU; 231001) | https://www.drnona.md/soupseen | /ru/product/soupseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| YAMSEEN (RO; 202001) | https://www.drnona.md/yamseen_ro | /ro/product/yamseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
| YAMSEEN (RU; 202001) | https://www.drnona.md/yamseen | /ru/product/yamseen | Полный текст: desktop + mobile PASS | Нет текстовых расхождений |
