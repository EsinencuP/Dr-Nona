// Search copy describes existing pages and product fields, never efficacy claims.
const staticCopy = {
  default: {
    "/reviews": ["Отзывы клиентов — Dr. Nona Moldova", "Отзывы о продуктах Dr. Nona и общем опыте клиентов. Выберите продукт по SKU или оставьте свой отзыв для проверки администратором."],
    "/": ["Dr. Nona Moldova — продукция и Halo Complex™", "Продукция Dr. Nona в Молдове: уход за лицом, телом и волосами, пищевые добавки и ароматы. Каталог, история компании и формула Halo Complex™."],
    "/products": ["Каталог продукции — Dr. Nona Moldova", "Каталог Dr. Nona в Молдове: кремы, средства гигиены, напитки, пищевые добавки и парфюмерия. Описания продуктов, поиск и фильтры по категориям."],
    "/about": ["О бренде и его основателях — Dr. Nona Moldova", "Познакомьтесь с Dr. Nona: история бренда, основатели, принципы компании и подход к разработке продукции. Переходы ко всем разделам о компании."],
    "/about/company": ["Компания и её принципы — Dr. Nona Moldova", "Dr. Nona International: принципы компании, международное развитие и представительство в Молдове. Узнайте, как устроен бренд и его работа."],
    "/about/our-history": ["История компании с 1994 года — Dr. Nona Moldova", "История Dr. Nona International с основания в 1994 году: ключевые этапы развития и становления международного бренда в хронологическом порядке."],
    "/about/founders": ["Основатели компании — Dr. Nona Moldova", "Доктор Нонна и Михаил Шнеерсон — основатели Dr. Nona International. История людей, стоящих у истоков компании и её развития."],
    "/about/science": ["Наука, производство и технологии — Dr. Nona Moldova", "Подход Dr. Nona к разработке продукции: исследования, производственные процессы и контроль качества. Узнайте больше о научном направлении компании."],
    "/ourformula": ["Halo Complex™: история формулы — Dr. Nona Moldova", "История Halo Complex™: Мёртвое море, археи, водоросль Dunaliella и минералы. Происхождение формулы Dr. Nona и ссылка на патент IL222127B."],
    "/contactus": ["Контакты и консультация — Dr. Nona Moldova", "Свяжитесь с Dr. Nona в Молдове: телефон и форма обращения. Задайте вопрос о продукции или передайте консультанту выбранные продукты."],
    "/certificates": ["Сертификаты и запрос документов — Dr. Nona Moldova", "Документы о продукции Dr. Nona для рынка Молдовы. Перейдите к форме обращения, чтобы запросить необходимые сертификаты и уточнить сведения."],
    "/selection": ["Выбранные продукты — Dr. Nona Moldova", "Ваша подборка продуктов Dr. Nona. Проверьте сохранённые позиции и передайте их консультанту через форму обращения."],
    "/bad-request": ["Некорректная ссылка — Dr. Nona Moldova", "Адрес страницы содержит некорректные символы. Вернитесь на главную страницу Dr. Nona Moldova или откройте каталог продукции."],
    "/faq": ["Вопросы и ответы — Dr. Nona Moldova", "Раздел вопросов и ответов Dr. Nona. Если нужных сведений нет на странице, обратитесь через контакты представительства в Молдове."],
    "/privacypolicy": ["Политика конфиденциальности — Dr. Nona Moldova", "Данные обращений и хранилище браузера Dr. Nona Moldova. Рабочая версия политики; реквизиты оператора и сроки хранения требуют уточнения."],
    "/termsofuse": ["Условия использования сайта — Dr. Nona Moldova", "Условия использования сайта Dr. Nona International: правила доступа к материалам и положения об использовании опубликованной информации."],
    "/accessibility-statement": ["Доступность сайта — Dr. Nona Moldova", "Заявление Dr. Nona International о доступности: описание адаптаций сайта, доступных функций и контактов для обращений по вопросам доступности."],
    "/business": ["Информация о сотрудничестве — Dr. Nona Moldova", "Информационный раздел Dr. Nona International о сотрудничестве с компанией. Для уточнения условий в Молдове используйте страницу контактов."],
    "/about/founders/dr_nona_kuchina": ["Доктор Нонна Кучина: биография — Dr. Nona Moldova", "Биография Доктора Нонны Кучиной, сооснователя Dr. Nona International. Жизненный путь и история участия в создании компании."],
    "/about/founders/michael_shneerson": ["Михаил Шнеерсон: биография — Dr. Nona Moldova", "Биография Михаила Шнеерсона, сооснователя Dr. Nona International. Образование, профессиональный путь и история становления компании."],
  },
  ru: {
    "/reviews": ["Отзывы о Dr. Nona — мнения клиентов", "Читайте отзывы клиентов о Dr. Nona. Поделитесь впечатлениями о конкретном продукте или общим опытом; каждый отзыв проходит модерацию."],
    "/": ["Dr. Nona Moldova — каталог средств для ухода", "Откройте каталог Dr. Nona: уход за лицом и телом, средства для волос, добавки и ароматы. Узнайте об истории бренда и Halo Complex™ в Молдове."],
    "/products": ["Продукты и категории каталога — Dr. Nona Moldova", "Выберите категорию продукции Dr. Nona, найдите нужный продукт по названию и изучите его описание. Каталог для знакомства с ассортиментом в Молдове."],
    "/about": ["Знакомство с компанией — Dr. Nona Moldova", "Dr. Nona: от истории основания до современного производства. Познакомьтесь с компанией, её основателями и научным подходом к созданию продукции."],
    "/about/company": ["Принципы и развитие Dr. Nona International в Молдове", "Информация о Dr. Nona International, принципах работы и международном развитии компании. Отдельный раздел о бренде и его представлении в Молдове."],
    "/about/our-history": ["Этапы развития Dr. Nona International с 1994 года", "Проследите развитие Dr. Nona International: основание компании в 1994 году и последующие этапы её истории, собранные в единую хронологию."],
    "/about/founders": ["Доктор Нонна и Михаил Шнеерсон — основатели Dr. Nona", "Познакомьтесь с Доктором Нонной и Михаилом Шнеерсоном. Рассказ об основателях Dr. Nona International и их роли в истории бренда."],
    "/about/science": ["Разработка и контроль качества — Dr. Nona Moldova", "Как Dr. Nona разрабатывает и выпускает продукцию: научный подход, организация производства, контроль качества и экологические принципы компании."],
    "/ourformula": ["Halo Complex™ и Мёртвое море — Dr. Nona Moldova", "Познакомьтесь с происхождением Halo Complex™. История архей, Dunaliella и минералов Мёртвого моря, научного подхода Dr. Nona и патента IL222127B."],
    "/contactus": ["Связаться с консультантом — Dr. Nona Moldova", "Задайте вопрос представителю Dr. Nona в Молдове по телефону или через форму. Выбранные продукты можно передать вместе с обращением."],
    "/certificates": ["Документы о продукции для Молдовы — Dr. Nona", "Уточните сведения о документах Dr. Nona, относящихся к рынку Молдовы. На странице доступен переход для запроса сертификатов через форму связи."],
    "/selection": ["Моя подборка для консультанта — Dr. Nona Moldova", "Сохранённые продукты Dr. Nona для обращения к консультанту. Проверьте список перед переходом к форме связи."],
  },
  ro: {
    "/reviews": ["Recenziile clienților — Dr. Nona Moldova", "Recenzii despre produsele Dr. Nona și experiențele clienților. Alege un produs după SKU sau trimite propria recenzie spre verificare."],
    "/privacypolicy": ["Politica de confidențialitate — Dr. Nona Moldova", "Datele solicitărilor și stocarea în browser pentru Dr. Nona Moldova. Versiune de lucru; datele operatorului necesită precizare."],
    "/": ["Dr. Nona Moldova — produse și Halo Complex™", "Descoperă produsele Dr. Nona în Moldova: îngrijirea feței, corpului și părului, suplimente și parfumuri. Catalogul și povestea Halo Complex™."],
    "/products": ["Catalog de produse și categorii — Dr. Nona Moldova", "Explorează catalogul Dr. Nona: creme, produse de igienă, băuturi, suplimente și parfumuri. Caută produse și consultă descrierile lor în română."],
    "/about": ["Despre brand și fondatori — Dr. Nona Moldova", "Cunoaște brandul Dr. Nona: istoria companiei, fondatorii, principiile și abordarea dezvoltării produselor. Acces la toate secțiunile despre companie."],
    "/about/company": ["Compania și principiile sale — Dr. Nona Moldova", "Dr. Nona International: principiile companiei, dezvoltarea internațională și reprezentarea în Moldova. Află mai multe despre activitatea brandului."],
    "/about/our-history": ["Istoria companiei din 1994 — Dr. Nona Moldova", "Istoria Dr. Nona International, de la fondarea din 1994 la dezvoltarea unui brand internațional. Descoperă principalele etape în ordine cronologică."],
    "/about/founders": ["Fondatorii companiei — Dr. Nona Moldova", "Dr. Nona și Mihail Shneerson, fondatorii Dr. Nona International. Cunoaște oamenii aflați la începutul istoriei companiei și al dezvoltării brandului."],
    "/about/science": ["Știință, producție și tehnologie — Dr. Nona Moldova", "Abordarea Dr. Nona în dezvoltarea produselor: cercetare, procese de producție și controlul calității. Află mai multe despre activitatea companiei."],
    "/ourformula": ["Halo Complex™: povestea formulei — Dr. Nona Moldova", "Povestea Halo Complex™: Marea Moartă, arhee, alga Dunaliella și minerale. Originea formulei Dr. Nona și trimiterea la brevetul IL222127B."],
    "/contactus": ["Contact și consultație în Moldova — Dr. Nona", "Contactează Dr. Nona în Moldova prin telefon sau formular. Pune o întrebare despre produse sau transmite selecția ta unui consultant."],
    "/certificates": ["Certificate și solicitări de documente — Dr. Nona Moldova", "Documente despre produsele Dr. Nona pentru piața din Moldova. Accesează formularul de contact pentru a solicita certificate și informații suplimentare."],
    "/selection": ["Produsele tale selectate — Dr. Nona Moldova", "Selecția ta de produse Dr. Nona. Verifică produsele salvate și transmite lista consultantului prin formularul de contact."],
  },
};

export function getSearchCopy(route, product, romanianProduct) {
  const basePath = route.path.replace(/^\/(?:ru|ro)(?=\/|$)/u, "") || "/";
  const variant = route.path === "/ru" || route.path.startsWith("/ru/") ? "ru"
    : route.locale === "ro" ? "ro" : "default";
  if (!product) {
    const copy = staticCopy[variant][basePath] ?? staticCopy.default[basePath];
    if (!copy) throw new Error(`Write search copy for new page: ${route.path}`);
    return { title: copy[0], description: copy[1] };
  }

  // Retain official English product names, consistent with the catalogue identity.
  const name = product.officialName;
  const isRomanian = variant === "ro";
  const availableFields = [];
  if (product.ingredients !== null) availableFields.push(isRomanian ? "compoziție" : "состав");
  if (product.howToUse !== null) availableFields.push(isRomanian ? "mod de utilizare" : "способ применения");
  const fields = availableFields.length ? `, ${availableFields.join(", ")}` : "";
  if (isRomanian) return {
    title: `${name}: detalii — Dr. Nona Moldova`,
    description: `${name} Dr. Nona. Categoria: ${romanianProduct.category}. Descriere${fields}. Informații despre produs pentru Moldova.`,
  };
  return variant === "ru" ? {
    title: `${name}: описание — Dr. Nona Moldova`,
    description: `${name} — ${product.category.toLocaleLowerCase("ru")}. Описание${fields} продукта Dr. Nona в каталоге для Молдовы.`,
  } : {
    title: `${name} — Dr. Nona Moldova`,
    description: `${name} Dr. Nona. Категория: ${product.category.toLocaleLowerCase("ru")}. Сведения о продукте${fields} в каталоге для Молдовы.`,
  };
}
