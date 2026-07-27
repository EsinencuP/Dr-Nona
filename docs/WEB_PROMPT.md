# Dr. Nona Website — Future Build Handoff

Status: **DRAFT — DO NOT EXECUTE**  
Purpose: сохранить структуру будущего handoff без разрешения на код.

Этот документ не является командой начать разработку. Его можно активировать
только после явного разрешения пользователя и прохождения
`IMPLEMENTATION_READINESS.md`.

## Future prompt skeleton

Ты — senior frontend developer и UX/UI designer.

Перед любой работой полностью прочитай:

1. `MASTER_DESIGN_FOUNDATION.md`;
2. `PROJECT_BRIEF.md`;
3. `DESIGN_CONTRACT.md`;
4. `DESIGN.md`;
5. `COLOR_SYSTEM.md`;
6. `DESIGN_SKILL_STACK.md`;
7. `CONTENT_MODEL.md`;
8. `DECISIONS.md`;
9. `IMPLEMENTATION_READINESS.md`.

Не пиши код, если статус readiness остаётся `NOT READY FOR CODE`.

### Project goal

Создать уникальный современный электронный каталог Dr. Nona, который знакомит с
брендом и продукцией, помогает собрать подборку и связаться с консультантом.

### Target audience

Люди зрелого и старшего возраста. Точный возрастной диапазон: TODO.

### Geography and languages

Target market: Moldova.

Languages: Russian and Romanian.

Primary language and localized URL strategy: TODO.

### Stack

TODO — не выбирать автоматически.

### Page parity

Account for every meaningful public template listed in `PAGE_INVENTORY.md`:

- Home;
- Catalog and product detail;
- Search;
- About hub and nested company/history/founder/science pages;
- Halo Complex™;
- Blog index/article and News index/article through one top-level editorial
  navigation entry;
- Contact;
- Branches;
- Certificates;
- FAQ;
- Business opportunity;
- Terms, Privacy and Accessibility.

Do not add login, register, profile, cart, checkout or payment success under the
current catalog-only decision.

### Required product behavior

- поиск;
- фильтры;
- сортировка;
- адаптивные карточки;
- карточка товара;
- похожие товары;
- отзывы из утверждённого источника;
- добавить/удалить из подборки;
- контакт с консультантом с контекстом подборки.

### Hard exclusions

- cart;
- checkout;
- payment;
- purchase;
- price-led UX;
- stock urgency;
- login/account, если не будет отдельно утверждён;
- сгенерированные маркетинговые тексты;
- случайные изображения;
- AI-модели;
- медицинский портал;
- marketplace UI.

### Design requirements

Следовать только утверждённым правилам `DESIGN.md` и `COLOR_SYSTEM.md`. Не
заполнять TODO самостоятельно и не изобретать токены.

- Halo Complex™/официально подтверждённое название научного комплекса — первый
  содержательный приоритет;
- Mineral Light: белый и голубой доминируют;
- золото и зелёный используются редко;
- Lord полностью переключает page-level тему;
- каталог использует функциональную плотность;
- компоненты мягкие и округлые;
- motion сдержанный и производительный.

### Content requirements

Использовать только записи со статусом `APPROVED`. Сохранять source URL и дату
проверки. Не публиковать placeholder и непроверенные claims.

### Accessibility

- keyboard navigation;
- focus-visible;
- reduced motion;
- достаточный контраст;
- семантика;
- alt-тексты;
- доступные формы и фильтры.

### Performance

- минимум layout shift;
- зарезервированные размеры медиа;
- оптимизированные изображения;
- отсутствие долгих блокирующих анимаций;
- budgets: TODO.

### Final QA

- все страницы соответствуют утверждённой IA;
- нет commerce-паттернов;
- подборка не выглядит как корзина;
- все материалы имеют источник;
- desktop/tablet/mobile проверены;
- основные сценарии пройдены с клавиатуры;
- reduced motion проверен;
- нет непредусмотренных страниц, текстов, изображений и токенов.
