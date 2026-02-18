import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { CurrentUserProvider } from "./contexts/CurrentUserContext";
import { GlobalSearchProvider } from "./contexts/GlobalSearchContext";
import { RemindersProvider } from "./contexts/RemindersContext";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CurrentUserProvider>
      <GlobalSearchProvider>
        <RemindersProvider>
          <App />
        </RemindersProvider>
      </GlobalSearchProvider>
    </CurrentUserProvider>
  </React.StrictMode>
);
