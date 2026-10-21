import { useOfficialPageData } from "../data";
import { GenericOfficialPage } from "../features/content/GenericOfficialPage";
import { isRetiredEditorialPath } from "../editorial-policy.mjs";
import { useLocation } from "../router";
import NotFoundPage from "./NotFoundPage";

export default function DynamicOfficialPage() {
  const location = useLocation();
  const { pageByPath } = useOfficialPageData();
  if (isRetiredEditorialPath(location.pathname) || location.pathname === "/warehouses") return <NotFoundPage />;
  if (pageByPath.has(location.pathname)) return <GenericOfficialPage />;
  return <NotFoundPage />;
}
