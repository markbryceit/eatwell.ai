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

    const dislikedRecipeIds = userProfile.disliked_recipes || [];

    recipes.forEach(recipe => {
      // Skip disliked recipes
      if (dislikedRecipeIds.includes(recipe.id)) {
        return;
      }

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

    const mealsPerDay = userProfile.meals_per_day || 3;
    
    // Adjust calorie distribution based on meals per day
    let targetPerMeal = {};
    if (mealsPerDay === 2) {
      // 2 meals: breakfast (40%) + dinner (60%)
      targetPerMeal = {
        breakfast: Math.round(calorie_target * 0.40),
        lunch: 0,
        dinner: Math.round(calorie_target * 0.60),
        snack: 0
      };
    } else if (mealsPerDay === 3) {
      // 3 meals: breakfast (25%) + lunch (35%) + dinner (40%)
      targetPerMeal = {
        breakfast: Math.round(calorie_target * 0.25),
        lunch: Math.round(calorie_target * 0.35),
        dinner: Math.round(calorie_target * 0.40),
        snack: 0
      };
    } else {
      // 4 meals: breakfast (25%) + lunch (35%) + dinner (30%) + snack (10%)
      targetPerMeal = {
        breakfast: Math.round(calorie_target * 0.25),
        lunch: Math.round(calorie_target * 0.35),
        dinner: Math.round(calorie_target * 0.30),
        snack: Math.round(calorie_target * 0.10)
      };
    }

    const activeMealTypes = [];
    if (targetPerMeal.breakfast > 0) activeMealTypes.push('breakfast');
    if (targetPerMeal.lunch > 0) activeMealTypes.push('lunch');
    if (targetPerMeal.dinner > 0) activeMealTypes.push('dinner');
    if (targetPerMeal.snack > 0) activeMealTypes.push('snack');

    // Format recipes in a compact way to avoid CSP issues
    const formatRecipes = (recipes) => {
      return recipes.map(r => 
        `ID: ${r.id} | ${r.name} | ${r.calories}kcal | P:${r.protein_g}g C:${r.carbs_g}g F:${r.fat_g}g${r.is_favorite ? ' ⭐' : ''}${r.user_has_cooked ? ' ✓' : ''}`
      ).join('\n');
    };

    const prompt = `You are a nutrition AI creating a 7-day meal plan.

USER PROFILE:
- Dietary preferences: ${userProfile.dietary_preferences?.join(', ') || 'None'}
- Ingredients to avoid: ${userProfile.disliked_ingredients?.join(', ') || 'None'}
- Disliked recipe IDs: ${userProfile.disliked_recipes?.join(', ') || 'None'}
- Health goal: ${userProfile.health_goal}
- Daily calorie target: ${calorie_target} kcal
- Meals per day: ${mealsPerDay}

ACTIVE MEALS: ${activeMealTypes.join(', ')}

CALORIE TARGETS PER MEAL:
${targetPerMeal.breakfast > 0 ? `- Breakfast: ${targetPerMeal.breakfast} kcal` : ''}
${targetPerMeal.lunch > 0 ? `- Lunch: ${targetPerMeal.lunch} kcal` : ''}
${targetPerMeal.dinner > 0 ? `- Dinner: ${targetPerMeal.dinner} kcal` : ''}
${targetPerMeal.snack > 0 ? `- Snack: ${targetPerMeal.snack} kcal` : ''}

USER BEHAVIOR:
- Favorite recipes: ${favoriteRecipes.map(r => r.name).join(', ') || 'None'}
- High-rated recipes: ${highRatedRecipeIds.length} recipes
- Has cooked: ${cookedRecipeIds.size} different recipes

AVAILABLE RECIPES (⭐=favorite, ✓=cooked before):

BREAKFAST OPTIONS:
${formatRecipes(recipesByType.breakfast)}

LUNCH OPTIONS:
${formatRecipes(recipesByType.lunch)}

DINNER OPTIONS:
${formatRecipes(recipesByType.dinner)}

SNACK OPTIONS:
${formatRecipes(recipesByType.snack)}

REQUIREMENTS:
1. CRITICAL: Create a COMPLETE 7-day meal plan for EVERY day using ONLY the active meals: ${activeMealTypes.join(', ')}
2. MUST select valid recipe IDs from the available recipes above for ACTIVE meals only
3. For INACTIVE meals (calorie target = 0), you MUST set the recipe_id to null
4. NEVER leave any ACTIVE meal slot empty - every active meal MUST be filled
5. CRITICAL: ONLY select recipes from their correct meal_type category:
   - breakfast_recipe_id MUST come from recipesByType.breakfast array
   - lunch_recipe_id MUST come from recipesByType.lunch array
   - dinner_recipe_id MUST come from recipesByType.dinner array
   - snack_recipe_id MUST come from recipesByType.snack array
   - DO NOT put desserts or cakes in breakfast slots
   - DO NOT put breakfast items in dinner slots
6. CRITICAL CALORIE MATCHING: For each meal, you MUST select recipes with calories VERY CLOSE to the target:
   - Breakfast target: ${targetPerMeal.breakfast} kcal - select recipes between ${Math.round(targetPerMeal.breakfast * 0.8)}-${Math.round(targetPerMeal.breakfast * 1.2)} kcal
   - Lunch target: ${targetPerMeal.lunch} kcal - select recipes between ${Math.round(targetPerMeal.lunch * 0.8)}-${Math.round(targetPerMeal.lunch * 1.2)} kcal
   - Dinner target: ${targetPerMeal.dinner} kcal - select recipes between ${Math.round(targetPerMeal.dinner * 0.8)}-${Math.round(targetPerMeal.dinner * 1.2)} kcal
   - Snack target: ${targetPerMeal.snack} kcal - select recipes between ${Math.round(targetPerMeal.snack * 0.8)}-${Math.round(targetPerMeal.snack * 1.2)} kcal
   - Look at the "calories" field in each recipe and pick the ones closest to the target
7. DAILY CALORIE TOTAL: The sum of all meals must be within ${calorie_target - 200} to ${calorie_target + 200} kcal
8. Prioritize recipes the user has favorited or highly rated when available
9. Include popular community recipes (high community_favorites and community_avg_rating)
10. Ensure variety - don't repeat the same recipe more than twice in the week
11. Match dietary preferences and avoid disliked ingredients
12. NEVER recommend any recipe from the disliked recipe IDs list
13. Balance macros across the week (adequate protein, fiber)
14. Mix familiar recipes (user has cooked) with new discoveries

CRITICAL VALIDATION:
- Each day MUST have all 4 fields: breakfast_recipe_id, lunch_recipe_id, dinner_recipe_id, snack_recipe_id
- ACTIVE meal recipe IDs MUST exist in the available recipes list above
- INACTIVE meals MUST have null as their recipe_id
- Return exactly 7 days, no more, no less
- NO null values for ACTIVE meals (${activeMealTypes.join(', ')})

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
                breakfast_recipe_id: { type: ["string", "null"] },
                lunch_recipe_id: { type: ["string", "null"] },
                dinner_recipe_id: { type: ["string", "null"] },
                snack_recipe_id: { type: ["string", "null"] }
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
      // Ensure inactive meals are null
      const ensureMeal = (recipeId, mealType) => {
        // If meal is inactive (calorie target is 0), force it to null
        if (targetPerMeal[mealType] === 0) {
          return null;
        }
        
        // If meal is active but ID is missing or invalid, use fallback
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe) return recipeId;
        
        const fallbackOptions = recipesByType[mealType];
        if (fallbackOptions && fallbackOptions.length > 0) {
          const fallback = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
          console.warn(`Day ${index + 1}: Missing ${mealType}, using fallback ${fallback.id}`);
          return fallback.id;
        }
        return null;
      };

      const validBreakfastId = ensureMeal(day.breakfast_recipe_id, 'breakfast');
      const validLunchId = ensureMeal(day.lunch_recipe_id, 'lunch');
      const validDinnerId = ensureMeal(day.dinner_recipe_id, 'dinner');
      const validSnackId = ensureMeal(day.snack_recipe_id, 'snack');

      // Calculate total calories only for active meals
      const validBreakfast = validBreakfastId ? recipes.find(r => r.id === validBreakfastId) : null;
      const validLunch = validLunchId ? recipes.find(r => r.id === validLunchId) : null;
      const validDinner = validDinnerId ? recipes.find(r => r.id === validDinnerId) : null;
      const validSnack = validSnackId ? recipes.find(r => r.id === validSnackId) : null;
      
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