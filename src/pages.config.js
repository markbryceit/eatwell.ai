import AccountSettings from './pages/AccountSettings';
import AdminRecipeUpload from './pages/AdminRecipeUpload';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Home from './pages/Home';
import MealPlanner from './pages/MealPlanner';
import Onboarding from './pages/Onboarding';
import Recipes from './pages/Recipes';
import Learn from './pages/Learn';
import Community from './pages/Community';
import Progress from './pages/Progress';
import DiningOut from './pages/DiningOut';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountSettings": AccountSettings,
    "AdminRecipeUpload": AdminRecipeUpload,
    "Dashboard": Dashboard,
    "Discover": Discover,
    "Home": Home,
    "MealPlanner": MealPlanner,
    "Onboarding": Onboarding,
    "Recipes": Recipes,
    "Learn": Learn,
    "Community": Community,
    "Progress": Progress,
    "DiningOut": DiningOut,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};