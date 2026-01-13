import AccountSettings from './pages/AccountSettings';
import AdminRecipeUpload from './pages/AdminRecipeUpload';
import Community from './pages/Community';
import Dashboard from './pages/Dashboard';
import DiningOut from './pages/DiningOut';
import Discover from './pages/Discover';
import FridgeScanner from './pages/FridgeScanner';
import Home from './pages/Home';
import Learn from './pages/Learn';
import MealPlanner from './pages/MealPlanner';
import NutritionCoach from './pages/NutritionCoach';
import Onboarding from './pages/Onboarding';
import Progress from './pages/Progress';
import Recipes from './pages/Recipes';
import NutritionInsights from './pages/NutritionInsights';
import Goals from './pages/Goals';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountSettings": AccountSettings,
    "AdminRecipeUpload": AdminRecipeUpload,
    "Community": Community,
    "Dashboard": Dashboard,
    "DiningOut": DiningOut,
    "Discover": Discover,
    "FridgeScanner": FridgeScanner,
    "Home": Home,
    "Learn": Learn,
    "MealPlanner": MealPlanner,
    "NutritionCoach": NutritionCoach,
    "Onboarding": Onboarding,
    "Progress": Progress,
    "Recipes": Recipes,
    "NutritionInsights": NutritionInsights,
    "Goals": Goals,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};