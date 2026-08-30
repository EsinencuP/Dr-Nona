import { lazy, Suspense } from "react";
import { Redirect, Route, Routes } from "../router";
import HomePage from "../pages/HomePage";

const CatalogPage = lazy(() => import("../pages/CatalogPage"));
const ProductPage = lazy(() => import("../pages/ProductPage"));
const AboutPage = lazy(() => import("../pages/AboutPage"));
const HistoryPage = lazy(() => import("../pages/HistoryPage"));
const CompanyPage = lazy(() => import("../pages/CompanyPage"));
const SciencePage = lazy(() => import("../pages/SciencePage"));
const FoundersPage = lazy(() => import("../pages/FoundersPage"));
const FormulaPage = lazy(() => import("../pages/FormulaPage"));
const EditorialPage = lazy(() => import("../pages/EditorialPage"));
const BlogPage = lazy(() => import("../pages/BlogPage"));
const NewsPage = lazy(() => import("../pages/NewsPage"));
const SelectionPage = lazy(() => import("../pages/SelectionPage"));
const ContactPage = lazy(() => import("../pages/ContactPage"));
const CertificatesPage = lazy(() => import("../pages/CertificatesPage"));
const BadRequestPage = lazy(() => import("../pages/BadRequestPage"));
const DynamicOfficialPage = lazy(() => import("../pages/DynamicOfficialPage"));

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="page-loader" aria-live="polite">
          <span />
          <p>Загрузка страницы</p>
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
        <Route path="/editorial" element={<EditorialPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/selection" element={<SelectionPage />} />
        <Route path="/contactus" element={<ContactPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/bad-request" element={<BadRequestPage />} />
        <Route path="*" element={<DynamicOfficialPage />} />
      </Routes>
    </Suspense>
  );
}
