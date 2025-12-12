import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Recipes from './pages/Recipes';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Onboarding": Onboarding,
    "Dashboard": Dashboard,
    "Recipes": Recipes,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};