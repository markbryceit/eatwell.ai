import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { calorie_target } = await req.json();

    // Gather comprehensive user data
    const [profile, favorites, ratings, calorieLogs, recipes, allFavorites, allRatings] = await Promise.all([
      base44.entities.UserProfile.filter({ created_by: user.email }),
      base44.entities.FavoriteRecipe.filter({ created_by: user.email }),
      base44.entities.RecipeRating.filter({ created_by: user.email }),
      base44.entities.CalorieLog.filter({ created_by: user.email }),
      base44.entities.Recipe.list(),
      base44.asServiceRole.entities.FavoriteRecipe.list(),
      base44.asServiceRole.entities.RecipeRating.list()
    ]);

    const userProfile = profile[0];
    if (!userProfile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Analyze user behavior
    const favoriteRecipeIds = favorites.map(f => f.recipe_id);
    const favoriteRecipes = recipes.filter(r => favoriteRecipeIds.includes(r.id));
    
    const highRatedRecipeIds = ratings.filter(r => r.rating >= 4).map(r => r.recipe_id);
    
    // Get cooked recipes
    const cookedRecipeIds = new Set();
    calorieLogs.forEach(log => {
      log.meals_logged?.forEach(meal => {
        if (meal.completed && meal.recipe_id) {
          cookedRecipeIds.add(meal.recipe_id);
        }
      });
    });

    // Calculate community trends
    const favoriteCounts = {};
    allFavorites.forEach(f => {
      favoriteCounts[f.recipe_id] = (favoriteCounts[f.recipe_id] || 0) + 1;
    });

    const ratingData = {};
    allRatings.forEach(r => {
      if (!ratingData[r.recipe_id]) {
        ratingData[r.recipe_id] = { total: 0, count: 0 };
      }
      ratingData[r.recipe_id].total += r.rating;
      ratingData[r.recipe_id].count += 1;
    });

    // Organize recipes by meal type with metadata
    const recipesByType = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };

    recipes.forEach(recipe => {
      if (recipesByType[recipe.meal_type]) {
        recipesByType[recipe.meal_type].push({
          id: recipe.id,
          name: recipe.name,
          calories: recipe.calories,
          protein_g: recipe.protein_g,
          carbs_g: recipe.carbs_g,
          fat_g: recipe.fat_g,
          fiber_g: recipe.fiber_g,
          dietary_tags: recipe.dietary_tags || [],
          prep_time_mins: recipe.prep_time_mins || 0,
          cook_time_mins: recipe.cook_time_mins || 0,
          is_favorite: favoriteRecipeIds.includes(recipe.id),
          is_high_rated: highRatedRecipeIds.includes(recipe.id),
          user_has_cooked: cookedRecipeIds.has(recipe.id),
          community_favorites: favoriteCounts[recipe.id] || 0,
          community_avg_rating: ratingData[recipe.id] 
            ? (ratingData[recipe.id].total / ratingData[recipe.id].count).toFixed(1)
            : 0
        });
      }
    });

    const targetPerMeal = {
      breakfast: Math.round(calorie_target * 0.25),
      lunch: Math.round(calorie_target * 0.35),
      dinner: Math.round(calorie_target * 0.30),
      snack: Math.round(calorie_target * 0.10)
    };

    const prompt = `You are a nutrition AI creating a 7-day meal plan.

USER PROFILE:
- Dietary preferences: ${userProfile.dietary_preferences?.join(', ') || 'None'}
- Ingredients to avoid: ${userProfile.disliked_ingredients?.join(', ') || 'None'}
- Health goal: ${userProfile.health_goal}
- Daily calorie target: ${calorie_target} kcal

CALORIE TARGETS PER MEAL:
- Breakfast: ${targetPerMeal.breakfast} kcal
- Lunch: ${targetPerMeal.lunch} kcal
- Dinner: ${targetPerMeal.dinner} kcal
- Snack: ${targetPerMeal.snack} kcal

USER BEHAVIOR:
- Favorite recipes: ${favoriteRecipes.map(r => r.name).join(', ') || 'None'}
- High-rated recipes: ${highRatedRecipeIds.length} recipes
- Has cooked: ${cookedRecipeIds.size} different recipes

AVAILABLE RECIPES:
${JSON.stringify(recipesByType, null, 2)}

REQUIREMENTS:
1. CRITICAL: Create a COMPLETE 7-day meal plan with breakfast, lunch, dinner, and snack for EVERY day
2. MUST select valid recipe IDs from the available recipes above - these IDs are REQUIRED
3. NEVER leave any meal slot empty - every day MUST have all 4 meals filled
4. CRITICAL: ONLY select recipes from their correct meal_type category:
   - breakfast_recipe_id MUST come from recipesByType.breakfast array
   - lunch_recipe_id MUST come from recipesByType.lunch array
   - dinner_recipe_id MUST come from recipesByType.dinner array
   - snack_recipe_id MUST come from recipesByType.snack array
   - DO NOT put desserts or cakes in breakfast slots
   - DO NOT put breakfast items in dinner slots
5. For each meal type, try to get as close as possible to the target calories
6. Prioritize recipes the user has favorited or highly rated when available
7. Include popular community recipes (high community_favorites and community_avg_rating)
8. Ensure variety - don't repeat the same recipe more than twice in the week
9. Match dietary preferences and avoid disliked ingredients
10. If a perfect calorie match isn't available, pick the closest option and balance it across other meals
11. Balance macros across the week (adequate protein, fiber)
12. Mix familiar recipes (user has cooked) with new discoveries
13. TOTAL daily calories should be within ±300 of the target by combining all 4 meals

CRITICAL VALIDATION:
- Each day MUST have exactly 4 recipe IDs (breakfast_recipe_id, lunch_recipe_id, dinner_recipe_id, snack_recipe_id)
- All recipe IDs MUST exist in the available recipes list above
- Return exactly 7 days, no more, no less
- NO null or empty values allowed for any meal

Daily calorie distribution strategy:
- Aim for ${calorie_target} total per day
- If individual meal doesn't hit target, compensate with other meals
- Better to be slightly off per meal but hit daily target overall`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          days: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day_name: { type: "string" },
                breakfast_recipe_id: { type: "string" },
                lunch_recipe_id: { type: "string" },
                dinner_recipe_id: { type: "string" },
                snack_recipe_id: { type: "string" }
              }
            }
          },
          reasoning: {
            type: "string",
            description: "Brief explanation of the meal plan strategy"
          }
        }
      }
    });

    // Validate and calculate total calories for each day
    const enrichedDays = response.days.map((day, index) => {
      const breakfast = recipes.find(r => r.id === day.breakfast_recipe_id);
      const lunch = recipes.find(r => r.id === day.lunch_recipe_id);
      const dinner = recipes.find(r => r.id === day.dinner_recipe_id);
      const snack = recipes.find(r => r.id === day.snack_recipe_id);
      
      // Fallback: if any meal is missing, select a random recipe of that type
      const ensureMeal = (recipe, mealType, recipeId) => {
        if (recipe) return recipeId;
        const fallbackOptions = recipesByType[mealType];
        if (fallbackOptions && fallbackOptions.length > 0) {
          const fallback = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
          console.warn(`Day ${index + 1}: Missing ${mealType}, using fallback ${fallback.id}`);
          return fallback.id;
        }
        return recipeId; // Last resort, keep the original even if invalid
      };

      const validBreakfastId = ensureMeal(breakfast, 'breakfast', day.breakfast_recipe_id);
      const validLunchId = ensureMeal(lunch, 'lunch', day.lunch_recipe_id);
      const validDinnerId = ensureMeal(dinner, 'dinner', day.dinner_recipe_id);
      const validSnackId = ensureMeal(snack, 'snack', day.snack_recipe_id);

      // Recalculate with validated IDs
      const validBreakfast = recipes.find(r => r.id === validBreakfastId);
      const validLunch = recipes.find(r => r.id === validLunchId);
      const validDinner = recipes.find(r => r.id === validDinnerId);
      const validSnack = recipes.find(r => r.id === validSnackId);
      
      const totalCalories = 
        (validBreakfast?.calories || 0) +
        (validLunch?.calories || 0) +
        (validDinner?.calories || 0) +
        (validSnack?.calories || 0);

      return {
        ...day,
        breakfast_recipe_id: validBreakfastId,
        lunch_recipe_id: validLunchId,
        dinner_recipe_id: validDinnerId,
        snack_recipe_id: validSnackId,
        total_calories: totalCalories
      };
    });

    return Response.json({
      days: enrichedDays,
      reasoning: response.reasoning,
      calorie_target: calorie_target,
      user_preferences_applied: {
        dietary_preferences: userProfile.dietary_preferences || [],
        favorites_count: favoriteRecipeIds.length,
        health_goal: userProfile.health_goal
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});