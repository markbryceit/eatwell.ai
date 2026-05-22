import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { meal_plan_id } = await req.json();

    // Fetch meal plan
    const mealPlans = await base44.entities.MealPlan.filter({ created_by: user.email });
    const plan = meal_plan_id
      ? mealPlans.find(p => p.id === meal_plan_id)
      : mealPlans.find(p => p.is_active) || mealPlans[0];

    if (!plan) return Response.json({ error: 'No meal plan found' }, { status: 404 });

    // Collect all recipe IDs from the plan
    const recipeIdToNames = {};
    for (const day of plan.days || []) {
      for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack']) {
        const recipeId = day[`${mealType}_recipe_id`];
        if (recipeId) {
          if (!recipeIdToNames[recipeId]) recipeIdToNames[recipeId] = [];
          recipeIdToNames[recipeId].push(`${day.day_name} ${mealType}`);
        }
      }
    }

    const recipeIds = Object.keys(recipeIdToNames);
    if (recipeIds.length === 0) return Response.json({ error: 'No recipes in meal plan' }, { status: 400 });

    // Fetch all recipes
    const allRecipes = await base44.entities.Recipe.list();
    const planRecipes = allRecipes.filter(r => recipeIds.includes(r.id));

    // Fetch user's pantry
    const pantryRecords = await base44.entities.Pantry.filter({ created_by: user.email });
    const pantryIngredients = (pantryRecords[0]?.ingredients || []).map(i => i.toLowerCase().trim());

    // Collect all needed ingredients (normalised, deduplicated)
    const ingredientMap = {}; // normalised -> { ingredient (raw), recipe_names[] }
    for (const recipe of planRecipes) {
      for (const ingredient of recipe.ingredients || []) {
        // strip quantities: take last word(s) as key heuristic
        const normalised = ingredient.toLowerCase().trim();
        // Check if any pantry item is contained in this ingredient string
        const inPantry = pantryIngredients.some(p => normalised.includes(p) || p.includes(normalised.split(' ').slice(-1)[0]));
        if (!inPantry) {
          if (!ingredientMap[normalised]) {
            ingredientMap[normalised] = { ingredient, recipe_names: [] };
          }
          // add recipe names that use this ingredient
          const recipesMentioning = planRecipes.filter(r =>
            (r.ingredients || []).some(ing => ing.toLowerCase().trim() === normalised)
          );
          for (const r of recipesMentioning) {
            const names = recipeIdToNames[r.id] || [];
            for (const n of names) {
              if (!ingredientMap[normalised].recipe_names.includes(n)) {
                ingredientMap[normalised].recipe_names.push(n);
              }
            }
          }
        }
      }
    }

    const items = Object.values(ingredientMap).map(item => ({
      ingredient: item.ingredient,
      recipe_names: item.recipe_names,
      purchased: false
    }));

    // Delete existing grocery list for this week
    const existingLists = await base44.entities.GroceryList.filter({
      week_start_date: plan.week_start_date,
      created_by: user.email
    });
    for (const list of existingLists) {
      await base44.entities.GroceryList.delete(list.id);
    }

    // Create new grocery list
    const groceryList = await base44.entities.GroceryList.create({
      meal_plan_id: plan.id,
      week_start_date: plan.week_start_date,
      items
    });

    return Response.json({ groceryList, totalItems: items.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});