import { lazy, Suspense } from "react";
import { Redirect, Route, Routes } from "../router";
import HomePage from "../pages/HomePage";
import { useLocale } from "../locales/LocaleProvider";

const CatalogPage = lazy(() => import("../pages/CatalogPage"));
const ProductPage = lazy(() => import("../pages/ProductPage"));
const AboutPage = lazy(() => import("../pages/AboutPage"));
const HistoryPage = lazy(() => import("../pages/HistoryPage"));
const CompanyPage = lazy(() => import("../pages/CompanyPage"));
const SciencePage = lazy(() => import("../pages/SciencePage"));
const FoundersPage = lazy(() => import("../pages/FoundersPage"));
const FormulaPage = lazy(() => import("../pages/FormulaPage"));
const SelectionPage = lazy(() => import("../pages/SelectionPage"));
const ContactPage = lazy(() => import("../pages/ContactPage"));
const CertificatesPage = lazy(() => import("../pages/CertificatesPage"));
const PrivacyPage = lazy(() => import("../pages/PrivacyPage"));
const BadRequestPage = lazy(() => import("../pages/BadRequestPage"));
const DynamicOfficialPage = lazy(() => import("../pages/DynamicOfficialPage"));

export function AppRoutes() {
  const { locale } = useLocale();
  return (
    <Suspense
      fallback={
        <div className="page-loader" aria-live="polite">
          <span />
          <p>{locale === "ro" ? "Se încarcă pagina" : "Загрузка страницы"}</p>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/main" element={<Redirect to="/" />} />
        <Route path="/products" element={<CatalogPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/about/our-history" element={<HistoryPage />} />
        <Route path="/about/company" element={<CompanyPage />} />
        <Route path="/about/science" element={<SciencePage />} />
        <Route path="/about/founders" element={<FoundersPage />} />
        <Route path="/ourformula" element={<FormulaPage />} />
        <Route path="/selection" element={<SelectionPage />} />
        <Route path="/contactus" element={<ContactPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/privacypolicy" element={<PrivacyPage />} />
        <Route path="/bad-request" element={<BadRequestPage />} />
        <Route path="*" element={<DynamicOfficialPage />} />
      </Routes>
    </Suspense>
  );
}
