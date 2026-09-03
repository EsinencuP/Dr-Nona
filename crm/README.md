# Dr. Nona CRM Moldova

Автономная внутренняя CRM на Next.js 16, React 19, Shadcn UI (Base UI), Tailwind CSS 4 и Prisma. Приложение использует ту же базу заявок, что и публичный каталог Dr. Nona Moldova.

## Рабочие разделы

- `/dashboard` — KPI, динамика, регионы, UTM-источники и популярность товаров.
- `/orders` — фильтры, поиск, карточка заявки и смена статуса.
- `/clients` — дедуплицированные профили и история обращений.
- `/catalog` — внутренние цены по всем опубликованным товарам.

Других продуктовых или демонстрационных маршрутов в приложении нет. `/` перенаправляет на `/dashboard`.

## Локальный запуск

Требуется Node.js 22 и npm 10.

```bash
npm ci
copy .env.example .env
npm run db:generate
npm run dev
```

Локальный `DATABASE_URL="file:../../prisma/dev.db"` разрешается относительно `crm/prisma/schema.prisma` и указывает на `prisma/dev.db` основного проекта.

## Доступ

В development CRM можно открыть без авторизации, если `CRM_BASIC_USER` и `CRM_BASIC_PASSWORD` пусты. В production приложение работает по fail-closed принципу: без обеих переменных возвращается `503`, а с ними весь интерфейс и Server Actions защищены HTTP Basic Auth.

```dotenv
CRM_BASIC_USER="manager"
CRM_BASIC_PASSWORD="replace-with-a-long-random-secret"
```

Не коммитьте `.env` и реальные пароли.

## Синхронизация с публичным проектом

После изменения основной Prisma-схемы или каталога выполните:

```bash
npm run sync:shared
npm run db:generate
```

Команда обновляет локальные копии `prisma/schema.prisma`, `src/data/products.json`, логотип и favicon. Мутации CRM меняют общую базу напрямую.

## Проверки

```bash
npm run typecheck
npm run lint
npm run check
npm run build
```

## Production

Рекомендуемый домен — `crm.dr-nona.md`, корневая директория проекта при деплое — `crm/`. Текущая схема использует SQLite и подходит для локальной или постоянной серверной файловой системы. Перед serverless-деплоем на Vercel необходимо перейти на постоянную PostgreSQL-базу и обновить provider Prisma; SQLite-файл внутри serverless deployment не является надёжным production-хранилищем.

Показатель «выполнено по ценам» — сумма `priceAtPurchase × quantity` по выполненным заявкам. Прибыль не рассчитывается, потому что схема пока не содержит отдельную цену продажи и себестоимость.

## Источник шаблона

Интерфейс основан на MIT-шаблоне [next-shadcn-admin-dashboard-baseui](https://github.com/arhamkhnz/next-shadcn-admin-dashboard-baseui). Оригинальная лицензия сохранена в `LICENSE`.
