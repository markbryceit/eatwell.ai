import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather user data
    const [profile, favorites, ratings, mealPlans, calorieLogs, recipes] = await Promise.all([
      base44.entities.UserProfile.filter({ created_by: user.email }),
      base44.entities.FavoriteRecipe.filter({ created_by: user.email }),
      base44.entities.RecipeRating.filter({ created_by: user.email }),
      base44.entities.MealPlan.filter({ created_by: user.email }),
      base44.entities.CalorieLog.filter({ created_by: user.email }),
      base44.entities.Recipe.list()
    ]);

    const userProfile = profile[0];
    if (!userProfile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Analyze user behavior
    const favoriteRecipeIds = favorites.map(f => f.recipe_id);
    const favoriteRecipes = recipes.filter(r => favoriteRecipeIds.includes(r.id));
    
    const highRatedRecipeIds = ratings.filter(r => r.rating >= 4).map(r => r.recipe_id);
    const highRatedRecipes = recipes.filter(r => highRatedRecipeIds.includes(r.id));

    // Get recipes from meal plans (recently used)
    const usedRecipeIds = new Set();
    mealPlans.forEach(plan => {
      plan.days?.forEach(day => {
        ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
          const recipeId = day[`${mealType}_recipe_id`];
          if (recipeId) usedRecipeIds.add(recipeId);
        });
      });
    });
    const recentlyUsedRecipes = recipes.filter(r => usedRecipeIds.has(r.id));

    // Get recipes user has cooked
    const cookedRecipeIds = new Set();
    calorieLogs.forEach(log => {
      log.meals_logged?.forEach(meal => {
        if (meal.completed && meal.recipe_id) {
          cookedRecipeIds.add(meal.recipe_id);
        }
      });
    });

    // Calculate community trends (most favorited and highest rated)
    const allFavorites = await base44.asServiceRole.entities.FavoriteRecipe.list();
    const allRatings = await base44.asServiceRole.entities.RecipeRating.list();
    
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

    // Build context for AI
    const context = {
      user_profile: {
        dietary_preferences: userProfile.dietary_preferences || [],
        disliked_ingredients: userProfile.disliked_ingredients || [],
        health_goal: userProfile.health_goal,
        daily_calorie_target: userProfile.daily_calorie_target
      },
      user_behavior: {
        favorite_recipes: favoriteRecipes.map(r => ({
          name: r.name,
          meal_type: r.meal_type,
          dietary_tags: r.dietary_tags,
          calories: r.calories
        })),
        high_rated_recipes: highRatedRecipes.map(r => r.name),
        recently_used_recipes: recentlyUsedRecipes.map(r => r.name),
        cooked_recipe_count: cookedRecipeIds.size
      },
      available_recipes: recipes.map(r => ({
        id: r.id,
        name: r.name,
        meal_type: r.meal_type,
        calories: r.calories,
        dietary_tags: r.dietary_tags,
        community_favorites: favoriteCounts[r.id] || 0,
        community_avg_rating: ratingData[r.id] 
          ? (ratingData[r.id].total / ratingData[r.id].count).toFixed(1)
          : 0
      }))
    };

    // Filter out already favorited recipes
    const availableRecipes = context.available_recipes.filter(
      r => !favoriteRecipeIds.includes(r.id)
    );

    const prompt = `You are a nutrition AI recommending recipes to a user.

USER PROFILE:
- Dietary preferences: ${context.user_profile.dietary_preferences.join(', ') || 'None'}
- Ingredients to avoid: ${context.user_profile.disliked_ingredients.join(', ') || 'None'}
- Health goal: ${context.user_profile.health_goal}
- Daily calorie target: ${context.user_profile.daily_calorie_target} kcal

USER BEHAVIOR:
- Favorite recipes: ${context.user_behavior.favorite_recipes.map(r => r.name).join(', ') || 'None yet'}
- Recently used recipes: ${context.user_behavior.recently_used_recipes.join(', ') || 'None'}
- Has cooked ${context.user_behavior.cooked_recipe_count} recipes

TASK:
Analyze the user's preferences and behavior to recommend 12 recipe IDs from the available recipes.
Prioritize recipes that:
1. Match their dietary preferences and health goals
2. Are similar to recipes they've favorited or highly rated
3. Are popular in the community (high community_favorites and community_avg_rating)
4. Provide variety across different meal types
5. Match their calorie target per meal (~${Math.round(context.user_profile.daily_calorie_target / 4)} kcal per meal)
6. Do NOT contain ingredients they want to avoid

Available recipes:
${JSON.stringify(availableRecipes.slice(0, 100), null, 2)}

Return ONLY recipe IDs, ordered by relevance (most relevant first).`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommended_recipe_ids: {
            type: "array",
            items: { type: "string" },
            description: "Array of 12 recipe IDs ordered by relevance"
          },
          reasoning: {
            type: "string",
            description: "Brief explanation of why these recipes were recommended"
          }
        }
      }
    });

    return Response.json({
      recommendations: response.recommended_recipe_ids || [],
      reasoning: response.reasoning,
      user_context: {
        favorites_count: favoriteRecipeIds.length,
        ratings_count: ratings.length,
        cooked_count: cookedRecipeIds.size
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});