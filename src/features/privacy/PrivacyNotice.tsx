import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "../../locales/LocaleProvider";
import { Link, useLocation } from "../../router";
import { captureUtmParameters, clearOptionalSessionData, recordProductView } from "../contact/utm-capture";
import { getPrivacyChoice, setPrivacyChoice, subscribePrivacyChoice, type PrivacyChoice } from "./privacyChoice";

export function PrivacyNotice() {
  const { locale } = useLocale();
  const location = useLocation();
  const choice = useSyncExternalStore(subscribePrivacyChoice, getPrivacyChoice);
  const [editing, setEditing] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const rejectButton = useRef<HTMLButtonElement>(null);
  const notice = useRef<HTMLElement>(null);
  const visible = choice === "pending" || editing;
  const copy = locale === "ro" ? {
    title: "Cookies și date în browser",
    text: "Păstrăm limba, selecția de produse și alegerea ta în browser. Cu acordul tău, salvăm și sursa vizitei și produsele vizualizate pentru a le include în solicitare.",
    detail: "Datele opționale sunt dezactivate până la acceptare. Refuzul permite în continuare folosirea catalogului și a formularului.",
    policy: "Politica de confidențialitate", reject: "Refuză", accept: "Acceptă", close: "Păstrează alegerea",
    current: choice === "accepted" ? "Acum: datele opționale sunt permise." : "Acum: datele opționale sunt dezactivate.",
  } : {
    title: "Cookies и данные в браузере",
    text: "Мы сохраняем в браузере язык, подборку и ваш выбор согласия. С разрешения — также источник перехода и просмотренные продукты, чтобы передать их вместе с обращением.",
    detail: "Необязательные данные отключены до принятия. При отказе каталог и форма обращения продолжают работать.",
    policy: "Политика конфиденциальности", reject: "Отказаться", accept: "Принять", close: "Сохранить прежний выбор",
    current: choice === "accepted" ? "Сейчас: необязательные данные разрешены." : "Сейчас: необязательные данные отключены.",
  };

  useEffect(() => {
    const open = () => {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setEditing(true);
    };
    window.addEventListener("drnona:open-privacy", open);
    return () => window.removeEventListener("drnona:open-privacy", open);
  }, []);

  useEffect(() => {
    if (editing) rejectButton.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!visible || !notice.current) return;
    const element = notice.current;
    const update = () => {
      const bottom = Number.parseFloat(getComputedStyle(element).bottom) || 0;
      document.documentElement.style.setProperty("--privacy-notice-height", `${element.getBoundingClientRect().height + bottom + 20}px`);
    };
    update();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(element);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      document.documentElement.style.removeProperty("--privacy-notice-height");
    };
  }, [visible]);

  useEffect(() => {
    if (choice !== "accepted") {
      clearOptionalSessionData();
      return;
    }
    captureUtmParameters();
    const slug = location.pathname.match(/^\/product\/([a-z0-9-]+)$/)?.[1];
    if (slug) recordProductView(slug);
  }, [choice, location.pathname, location.search]);

  const close = () => {
    setEditing(false);
    returnFocus.current?.focus({ preventScroll: true });
  };
  const choose = (next: PrivacyChoice) => {
    setPrivacyChoice(next);
    close();
  };
  if (!visible) return null;
  return (
    <>
    <section ref={notice} className="privacy-notice" aria-labelledby="privacy-notice-title" aria-describedby="privacy-notice-text">
      <div>
        <h2 id="privacy-notice-title">{copy.title}</h2>
        <p id="privacy-notice-text">{copy.text}</p>
        <p className="privacy-notice__detail">{copy.detail}</p>
        {editing && choice !== "pending" && <p className="privacy-notice__detail">{copy.current}</p>}
        <Link className="inline-link" to="/privacypolicy">{copy.policy}</Link>
      </div>
      <div className="privacy-notice__actions">
        <button ref={rejectButton} className="button button--quiet" type="button" onClick={() => choose("rejected")}>{copy.reject}</button>
        <button className="button button--quiet" type="button" onClick={() => choose("accepted")}>{copy.accept}</button>
        {editing && choice !== "pending" && <button className="privacy-notice__close" type="button" onClick={close}>{copy.close}</button>}
      </div>
    </section>
    <div className="privacy-notice-spacer" aria-hidden="true" />
    </>
  );
}
