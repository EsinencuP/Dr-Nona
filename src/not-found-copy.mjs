const copy = {
  ru: {
    label: "Страница не найдена",
    title: "Эта страница ушла за горизонт",
    description: "Возможно, ссылка устарела или в адресе есть ошибка. Продолжите знакомство с Dr. Nona на главной странице или найдите нужный продукт в каталоге.",
    catalogue: "В каталог",
    home: "На главную",
  },
  ro: {
    label: "Pagină negăsită",
    title: "Această pagină a dispărut din orizont",
    description: "Este posibil ca linkul să fie învechit sau adresa să conțină o eroare. Continuați să descoperiți Dr. Nona pe pagina principală sau găsiți produsul dorit în catalog.",
    catalogue: "Vezi catalogul",
    home: "Pagina principală",
  },
};

export function getNotFoundCopy(locale) {
  return copy[locale === "ro" ? "ro" : "ru"];
}
