import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetCalories, mealType, excludeRecipeIds = [] } = await req.json();

    // Fetch user data
    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles[0];
    
    const favorites = await base44.entities.FavoriteRecipe.list();
    const ratings = await base44.entities.RecipeRating.list();
    const allRecipes = await base44.entities.Recipe.filter({ meal_type: mealType });

    // Filter recipes
    const availableRecipes = allRecipes.filter(r => !excludeRecipeIds.includes(r.id));
    
    // Get favorite recipe IDs
    const favoriteIds = favorites.map(f => f.recipe_id);
    const favoriteRecipes = availableRecipes.filter(r => favoriteIds.includes(r.id));
    
    // Get highly rated recipes (4+ stars)
    const highRatedIds = ratings.filter(r => r.rating >= 4).map(r => r.recipe_id);
    const highRatedRecipes = availableRecipes.filter(r => highRatedIds.includes(r.id));
    
    // Filter by dietary preferences
    const dietaryPreferences = profile?.dietary_preferences || [];
    const dislikedIngredients = profile?.disliked_ingredients || [];
    
    const suitableRecipes = availableRecipes.filter(recipe => {
      // Check dietary tags
      const hasDietaryMatch = dietaryPreferences.length === 0 || 
        dietaryPreferences.includes("No Restrictions") ||
        dietaryPreferences.some(pref => recipe.dietary_tags?.includes(pref));
      
      // Check for disliked ingredients
      const hasDislikedIngredient = dislikedIngredients.length > 0 &&
        recipe.ingredients?.some(ing => 
          dislikedIngredients.some(disliked => 
            ing.toLowerCase().includes(disliked.toLowerCase())
          )
        );
      
      return hasDietaryMatch && !hasDislikedIngredient;
    });

    // Calculate target calories for this meal type
    const mealTypeCalories = {
      breakfast: targetCalories * 0.25,
      lunch: targetCalories * 0.35,
      dinner: targetCalories * 0.30,
      snack: targetCalories * 0.10
    };
    
    const target = mealTypeCalories[mealType] || targetCalories * 0.25;

    // Find recipes within calorie range
    const calorieMatchRecipes = suitableRecipes.filter(r => 
      Math.abs(r.calories - target) <= 150
    );

    // Prioritize: favorites > high rated > calorie match > all suitable
    let recommendedRecipes = [];
    
    const favoriteCalorieMatch = favoriteRecipes.filter(r => calorieMatchRecipes.includes(r));
    const highRatedCalorieMatch = highRatedRecipes.filter(r => calorieMatchRecipes.includes(r));
    
    if (favoriteCalorieMatch.length > 0) {
      recommendedRecipes = favoriteCalorieMatch;
    } else if (highRatedCalorieMatch.length > 0) {
      recommendedRecipes = highRatedCalorieMatch;
    } else if (calorieMatchRecipes.length > 0) {
      recommendedRecipes = calorieMatchRecipes;
    } else {
      recommendedRecipes = suitableRecipes;
    }

    // Use AI to rank top 5 recipes based on user preferences and goals
    if (recommendedRecipes.length > 5) {
      const prompt = `Given the following user profile and recipe options, rank the top 5 recipes that best match their preferences and nutritional goals.

User Profile:
- Health Goal: ${profile?.health_goal}
- Activity Level: ${profile?.activity_level}
- Dietary Preferences: ${dietaryPreferences.join(', ')}
- Disliked Ingredients: ${dislikedIngredients.join(', ') || 'None'}
- Target Calories for ${mealType}: ${target} kcal

Favorite Recipes: ${favoriteRecipes.map(r => r.name).join(', ')}
Highly Rated Recipes: ${highRatedRecipes.map(r => r.name).join(', ')}

Available Recipes:
${recommendedRecipes.slice(0, 15).map(r => 
  `- ${r.name}: ${r.calories} kcal, Protein: ${r.protein_g}g, Carbs: ${r.carbs_g}g, Fat: ${r.fat_g}g`
).join('\n')}

Return the recipe IDs of the top 5 recipes in order of best match.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recipe_ids: {
              type: "array",
              items: { type: "string" }
            },
            reasoning: { type: "string" }
          },
          required: ["recipe_ids"]
        }
      });

      const rankedIds = aiResponse.recipe_ids || [];
      recommendedRecipes = rankedIds
        .map(id => recommendedRecipes.find(r => r.id === id))
        .filter(Boolean)
        .slice(0, 5);
    } else {
      recommendedRecipes = recommendedRecipes.slice(0, 5);
    }

    // If still not enough, add random suitable recipes
    if (recommendedRecipes.length < 3) {
      const remaining = suitableRecipes
        .filter(r => !recommendedRecipes.includes(r))
        .slice(0, 3 - recommendedRecipes.length);
      recommendedRecipes = [...recommendedRecipes, ...remaining];
    }

    return Response.json({
      recommendations: recommendedRecipes,
      totalAvailable: suitableRecipes.length
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});