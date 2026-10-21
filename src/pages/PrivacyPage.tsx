import { PageBreadcrumbs } from "../components/PageNavigation";
import privacyContent from "../features/privacy/privacyContent.json";
import { openPrivacyPreferences } from "../features/privacy/privacyChoice";
import { useLocale } from "../locales/LocaleProvider";
import { Link } from "../router";

export default function PrivacyPage() {
  const { locale } = useLocale();
  const copy = privacyContent[locale];
  return (
    <section className="privacy-page container">
      <PageBreadcrumbs current={copy.title} />
      <header className="official-page__header">
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
        <p className="privacy-page__date">{copy.updated}</p>
      </header>
      <div className="privacy-page__body">
        <aside className="privacy-page__status">
          <h2>{copy.statusTitle}</h2>
          <p>{copy.status}</p>
        </aside>
        {copy.sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`privacy-${section.id}`}>
            <h2 id={`privacy-${section.id}`}>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
        <section aria-labelledby="privacy-storage-title">
          <h2 id="privacy-storage-title">{copy.storageTitle}</h2>
          <dl className="privacy-storage-list">
            {copy.storage.map((item) => <div key={item.keys}>
              <dt>{item.name}</dt><dd><code>{item.keys}</code><p>{item.detail}</p></dd>
            </div>)}
          </dl>
        </section>
        <div className="privacy-page__actions">
          <button className="button button--primary" onClick={openPrivacyPreferences} type="button">{copy.settings}</button>
          <Link className="inline-link" to="/contactus">{copy.contact}</Link>
        </div>
        <p><a className="inline-link" href="https://datepersonale.md/about/faq/">{copy.authorityLabel}</a></p>
      </div>
    </section>
  );
}
