import { Check } from "@phosphor-icons/react/Check";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { safeLocalStorage, selectionSchema } from "../../app/storage";
import publishedProductSlugsJson from "../../data/published-product-slugs.json";

type SelectionContextValue = {
  selected: string[];
  toggle: (slug: string) => void;
  contains: (slug: string) => boolean;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);
const publishedProductSlugs = new Set(publishedProductSlugsJson as string[]);

export function sanitizeSelection(slugs: string[]) {
  return slugs.filter((slug) => publishedProductSlugs.has(slug));
}

export function useSelection() {
  const value = useContext(SelectionContext);
  if (!value) throw new Error("SelectionContext is unavailable");
  return value;
}

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>(() =>
    sanitizeSelection(
      safeLocalStorage.get("drnona-selection", selectionSchema, [])
    )
  );
  const [announcement, setAnnouncement] = useState("");
  const announcementTimer = useRef<number | null>(null);

  useEffect(() => {
    safeLocalStorage.set("drnona-selection", selected, selectionSchema);
  }, [selected]);

  useEffect(() => {
    const synchronizeSelection = (event: StorageEvent) => {
      if (event.key !== "drnona-selection") return;

      const nextSelection = event.newValue === null
        ? []
        : selectionSchema.parse(event.newValue);
      if (!nextSelection) return;

      const sanitized = sanitizeSelection(nextSelection);
      setSelected((current) =>
        current.length === sanitized.length &&
        current.every((slug, index) => slug === sanitized[index])
          ? current
          : sanitized
      );
    };

    window.addEventListener("storage", synchronizeSelection);
    return () => window.removeEventListener("storage", synchronizeSelection);
  }, []);

  useEffect(
    () => () => {
      if (announcementTimer.current !== null) {
        window.clearTimeout(announcementTimer.current);
      }
    },
    []
  );

  const value = useMemo<SelectionContextValue>(() => ({
    selected,
    contains: (slug) => selected.includes(slug),
    toggle: (slug) => {
      setSelected((current) => {
        const exists = current.includes(slug);
        setAnnouncement(
          exists
            ? "Продукт удалён из подборки"
            : "Продукт добавлен в подборку"
        );
        return exists
          ? current.filter((item) => item !== slug)
          : [...current, slug];
      });
      if (announcementTimer.current !== null) {
        window.clearTimeout(announcementTimer.current);
      }
      announcementTimer.current = window.setTimeout(() => {
        setAnnouncement("");
        announcementTimer.current = null;
      }, 2200);
    },
  }), [selected]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
      <div
        className={`toast ${announcement ? "is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        <Check aria-hidden="true" /> {announcement}
      </div>
    </SelectionContext.Provider>
  );
}
