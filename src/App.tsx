import { AppShell } from "./app/AppShell";
import { AppRoutes } from "./app/routes";
import { SelectionProvider } from "./features/selection/SelectionContext";
import { LocaleProvider } from "./locales/LocaleProvider";

export default function App() {
  return (
    <LocaleProvider>
      <SelectionProvider>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </SelectionProvider>
    </LocaleProvider>
  );
}
