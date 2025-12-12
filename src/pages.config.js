import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Recipes from './pages/Recipes';
import AdminRecipeUpload from './pages/AdminRecipeUpload';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Onboarding": Onboarding,
    "Dashboard": Dashboard,
    "Recipes": Recipes,
    "AdminRecipeUpload": AdminRecipeUpload,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};