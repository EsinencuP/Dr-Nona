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

type LocationState = {
  pathname: string;
  search: string;
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
  search: window.location.search,
});

const ParamsContext = createContext<Record<string, string>>({});

function readLocation(): LocationState {
  return {
    pathname: window.location.pathname || "/",
    search: window.location.search,
  };
}

function notifyNavigation() {
  window.dispatchEvent(new Event("drnona:navigate"));
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
  return <LocationContext.Provider value={location}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  return useContext(LocationContext);
}

export function useNavigate() {
  return (to: string, options: NavigateOptions = {}) => {
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === to) return;
    window.history[options.replace ? "replaceState" : "pushState"]({}, "", to);
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
  const navigate = useNavigate();
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
  return <a href={to} onClick={handleClick} {...props}>{children}</a>;
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

function matchRoute(pattern: string, pathname: string) {
  if (pattern === "*") return { matched: true, params: {} };
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);
  if (patternSegments.length !== pathSegments.length) return { matched: false, params: {} };
  const params: Record<string, string> = {};
  for (let index = 0; index < patternSegments.length; index += 1) {
    const expected = patternSegments[index];
    const actual = pathSegments[index];
    if (expected.startsWith(":")) params[expected.slice(1)] = decodeURIComponent(actual);
    else if (expected !== actual) return { matched: false, params: {} };
  }
  return { matched: true, params };
}

export function Routes({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  let fallback: RouteProps | null = null;
  for (const child of Children.toArray(children)) {
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
  return null;
}
