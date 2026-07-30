import { useOfficialPageData } from "../data";
import {
  ArticlePage,
  GenericOfficialPage,
} from "../features/editorial/EditorialPages";
import { useLocation } from "../router";
import NotFoundPage from "./NotFoundPage";

export default function DynamicOfficialPage() {
  const location = useLocation();
  const { pageByPath } = useOfficialPageData();
  if (
    location.pathname.startsWith("/blog/") ||
    location.pathname.startsWith("/news/")
  ) {
    return <ArticlePage />;
  }
  if (pageByPath.has(location.pathname)) return <GenericOfficialPage />;
  return <NotFoundPage />;
}
