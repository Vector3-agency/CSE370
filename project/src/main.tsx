import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./components/AuthProvider";
 import { ThemeProvider } from "./components/ThemeProvider";
 import ScrollToTop from "./components/ScrollToTop";
 import "./index.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
     <AuthProvider>
       <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
         <ScrollToTop />
         <App />
       </ThemeProvider>
     </AuthProvider>
   </BrowserRouter>
);
