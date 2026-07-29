# Dr. Nona Website

Статус проекта: **Frontend implementation complete / production build
verified**.

Реализован multi-page React/TypeScript сайт электронного каталога:
главная, каталог, продукт, Lord, About, история, Halo Complex™, Blog/News,
подборка и официальные информационные маршруты. Проект не является
интернет-магазином и не содержит корзину, checkout, оплату или авторизацию.

## Запуск

```powershell
npm.cmd install
npm.cmd run dev
```

Production-проверка:

```powershell
npm.cmd run build
```

## Документация

- `docs/MASTER_DESIGN_FOUNDATION.md` — главный источник истины.
- `docs/PROJECT_BRIEF.md` — продуктовый бриф и границы проекта.
- `docs/DESIGN.md` — дизайн-направление, правила и незакрытые токены.
- `docs/DESIGN_CONTRACT.md` — evidence, Keep / Change / Do not copy и quality gate.
- `docs/DESIGN_SKILL_STACK.md` — активная методология и роли дизайн-скиллов.
- `docs/COLOR_SYSTEM.md` — рабочая Mineral Light palette и тема Lord.
- `docs/CONTENT_MODEL.md` — модель контента и структура данных каталога.
- `docs/PAGE_INVENTORY.md` — карта page parity официальной платформы.
- `docs/REFERENCE_ANALYSIS.md` — анализ официального сайта.
- `docs/REF_IMAGE_ANALYSIS.md` — анализ локальных визуальных референсов.
- `docs/DECISIONS.md` — журнал утверждённых решений.
- `docs/OPEN_QUESTIONS.md` — вопросы, которые требуют ответа.
- `docs/IMPLEMENTATION_READINESS.md` — ворота готовности перед началом кода.
- `docs/IMPLEMENTATION_HANDOFF.md` — архитектура и ограничения реализации.
- `docs/QA_REPORT.md` — выполненные технические и браузерные проверки.
- `docs/audit/2026-07-26/AUDIT_REPORT.md` — итоговый аудит требований,
  source parity, responsive, accessibility, motion и production blockers.
- `docs/WEB_PROMPT.md` — черновик будущего handoff-промпта; не запускать до
  закрытия блокирующих решений.

## Правило приоритета

При конфликте документов действует следующий порядок:

1. Последнее явно утверждённое решение пользователя.
2. `docs/MASTER_DESIGN_FOUNDATION.md`.
3. Официальный источник Dr. Nona после редакционной проверки.
4. Остальные исследовательские документы.

Любая неоднозначность оформляется как `TODO`, а не превращается в
неподтверждённый продуктовый факт.
