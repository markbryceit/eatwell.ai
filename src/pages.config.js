/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AccountSettings from './pages/AccountSettings';
import AdminRecipeUpload from './pages/AdminRecipeUpload';
import Community from './pages/Community';
import Dashboard from './pages/Dashboard';
import DiningOut from './pages/DiningOut';
import Discover from './pages/Discover';
import FridgeScanner from './pages/FridgeScanner';
import Goals from './pages/Goals';
import Home from './pages/Home';
import KidsMeals from './pages/KidsMeals';
import Learn from './pages/Learn';
import MealPlanner from './pages/MealPlanner';
import NutritionCoach from './pages/NutritionCoach';
import NutritionInsights from './pages/NutritionInsights';
import Onboarding from './pages/Onboarding';
import Progress from './pages/Progress';
import Recipes from './pages/Recipes';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountSettings": AccountSettings,
    "AdminRecipeUpload": AdminRecipeUpload,
    "Community": Community,
    "Dashboard": Dashboard,
    "DiningOut": DiningOut,
    "Discover": Discover,
    "FridgeScanner": FridgeScanner,
    "Goals": Goals,
    "Home": Home,
    "KidsMeals": KidsMeals,
    "Learn": Learn,
    "MealPlanner": MealPlanner,
    "NutritionCoach": NutritionCoach,
    "NutritionInsights": NutritionInsights,
    "Onboarding": Onboarding,
    "Progress": Progress,
    "Recipes": Recipes,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};