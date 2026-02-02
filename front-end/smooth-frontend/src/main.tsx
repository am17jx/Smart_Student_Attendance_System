import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// تحميل الثيم المحفوظ
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
