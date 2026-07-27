# Dr. Nona Moldova — Implementation Handoff

Status: IMPLEMENTED FRONTEND PROTOTYPE  
Last updated: 2026-07-26

Этот документ фиксирует реализованную архитектуру и ограничения следующей
production-стадии.

## Files to read

1. `MASTER_DESIGN_FOUNDATION.md`
2. `DECISIONS.md`
3. `DESIGN_CONTRACT.md`
4. `DESIGN.md`
5. `COLOR_SYSTEM.md`
6. `DESIGN_SKILL_STACK.md`
7. `PROJECT_BRIEF.md`
8. `PAGE_INVENTORY.md`
9. `CONTENT_MODEL.md`
10. `OPEN_QUESTIONS.md`
11. `IMPLEMENTATION_READINESS.md`

## Binding constraints

- электронный каталог, не магазин;
- основной смысловой приоритет — Halo Complex™;
- аудитория — зрелая и старшая;
- языки — русский и румынский;
- Mineral Light: белый/голубой доминируют, золото и зелёный редки;
- Lord: полная page-level navy/gold theme;
- каталог плотный и рабочий;
- компоненты мягкие и округлые;
- motion сдержанный, прерываемый и производительный;
- только официальные или утверждённые материалы;
- cart, checkout, payment, price-driven UI, auth и AI-модели запрещены.

## Реализованные поверхности

- route-separated главная, каталог и карточки 55 продуктов;
- type filters, search, A—Z / Z—A / popularity / newest sorting;
- локальная подборка без commerce-сценариев;
- полный Lord theme switch;
- About, company, founders, history и science;
- Halo Complex™ formula page;
- объединённый Blog/News hub и отдельные article routes;
- динамическое покрытие официальных service/information routes;
- responsive navigation, keyboard focus, touch targets и reduced motion.

## Production blockers

Актуальный список находится в `IMPLEMENTATION_READINESS.md` и
`OPEN_QUESTIONS.md`. Любой неизвестный параметр остаётся TODO.

## Implementation entry points

- `src/App.tsx` — маршруты и UI;
- `src/styles.css` — Mineral Light / Lord design system;
- `src/router.tsx` — небольшой client-side router без уязвимой внешней
  зависимости;
- `src/data.ts` — типизированный доступ к official content;
- `scripts/sync-official-content.mjs` — повторяемая синхронизация источника.
