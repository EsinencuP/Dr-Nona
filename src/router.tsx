import {
  AnchorHTMLAttributes,
  Children,
  createContext,
  isValidElement,
  MouseEvent,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { reportClientError } from "./app/monitoring";

type LocationState = {
  pathname: string;
  localizedPathname: string;
  search: string;
  locale: "ru" | "ro";
  hasLocalePrefix: boolean;
};

type NavigateOptions = {
  replace?: boolean;
};

type RouteProps = {
  path: string;
  element: ReactElement;
};

const LocationContext = createContext<LocationState>({
  pathname: window.location.pathname,
  localizedPathname: window.location.pathname,
  search: window.location.search,
  locale: "ru",
  hasLocalePrefix: false,
});

const ParamsContext = createContext<Record<string, string>>({});

function readLocation(): LocationState {
  const localizedPathname = window.location.pathname || "/";
  const localeMatch = localizedPathname.match(/^\/(ru|ro)(?=\/|$)/);
  const locale = localeMatch?.[1] === "ro" ? "ro" : "ru";
  const pathname = localeMatch
    ? localizedPathname.slice(localeMatch[0].length) || "/"
    : localizedPathname;
  return {
    pathname,
    localizedPathname,
    search: window.location.search,
    locale,
    hasLocalePrefix: Boolean(localeMatch),
  };
}

function notifyNavigation() {
  window.dispatchEvent(new Event("drnona:navigate"));
}

export function safeDecodeRouteSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function isPathnameEncodingValid(pathname: string) {
  return pathname
    .split("/")
    .filter(Boolean)
    .every((segment) => safeDecodeRouteSegment(segment) !== null);
}

export function Router({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(readLocation);
  useEffect(() => {
    const update = () => setLocation(readLocation());
    window.addEventListener("popstate", update);
    window.addEventListener("drnona:navigate", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("drnona:navigate", update);
    };
  }, []);
  useEffect(() => {
    if (isPathnameEncodingValid(location.pathname)) return;
    reportClientError(
      new URIError("Malformed percent-encoding in route pathname."),
      { kind: "malformed-route", source: "router" }
    );
  }, [location.pathname]);
  return <LocationContext.Provider value={location}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  return useContext(LocationContext);
}

function localizeInternalPath(to: string, location: LocationState) {
  if (
    !to.startsWith("/") ||
    to.startsWith("//") ||
    /^\/(?:ru|ro)(?=\/|$)/.test(to) ||
    !location.hasLocalePrefix
  ) {
    return to;
  }
  return `/${location.locale}${to === "/" ? "" : to}`;
}

export function useNavigate() {
  const location = useLocation();
  return (to: string, options: NavigateOptions = {}) => {
    const destination = localizeInternalPath(to, location);
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === destination) return;
    window.history[options.replace ? "replaceState" : "pushState"](
      {},
      "",
      destination
    );
    notifyNavigation();
  };
}

export function useParams() {
  return useContext(ParamsContext);
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string>, options?: NavigateOptions) => void,
] {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const setParams = (
    next: URLSearchParams | Record<string, string>,
    options: NavigateOptions = {}
  ) => {
    const value = next instanceof URLSearchParams ? next : new URLSearchParams(next);
    const query = value.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ""}`, options);
  };
  return [params, setParams];
}

export function Link({
  to,
  onClick,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const href = localizeInternalPath(to, location);
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === "_blank"
    ) return;
    event.preventDefault();
    navigate(to);
  };
  return <a href={href} onClick={handleClick} {...props}>{children}</a>;
}

export function NavLink({
  to,
  className = "",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const { pathname } = useLocation();
  const active = to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Link
      to={to}
      className={`${className} ${active ? "active" : ""}`.trim()}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Redirect({ to }: { to: string }) {
  useEffect(() => {
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === to) return;
    window.history.replaceState({}, "", to);
    notifyNavigation();
  }, [to]);
  return null;
}

function matchRoute(pattern: string, pathname: string) {
  if (pattern === "*") return { matched: true, params: {} };
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);
  if (patternSegments.length !== pathSegments.length) return { matched: false, params: {} };
  const params: Record<string, string> = {};
  for (let index = 0; index < patternSegments.length; index += 1) {
    const expected = patternSegments[index];
    const actual = pathSegments[index];
    if (expected.startsWith(":")) {
      const decoded = safeDecodeRouteSegment(actual);
      if (decoded === null) return { matched: false, params: {} };
      params[expected.slice(1)] = decoded;
    } else if (expected !== actual) return { matched: false, params: {} };
  }
  return { matched: true, params };
}

export function Routes({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const routeChildren = Children.toArray(children);
  const fallbackElement = routeChildren.find(
    (child) => isValidElement<RouteProps>(child) && child.props.path === "*"
  );
  if (!isPathnameEncodingValid(pathname)) {
    return isValidElement<RouteProps>(fallbackElement)
      ? fallbackElement.props.element
      : null;
  }
  let fallback: RouteProps | null = null;
  for (const child of routeChildren) {
    if (!isValidElement<RouteProps>(child)) continue;
    if (child.props.path === "*") {
      fallback = child.props;
      continue;
    }
    const result = matchRoute(child.props.path, pathname);
    if (result.matched) {
      return <ParamsContext.Provider value={result.params}>{child.props.element}</ParamsContext.Provider>;
    }
  }
  return fallback?.element ?? null;
}

export function Route(_props: RouteProps) {
  void _props;
  return null;
}
