import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    if (!query) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    // Get all recipes and user profile
    const [recipes, profile] = await Promise.all([
      base44.asServiceRole.entities.Recipe.list(),
      base44.entities.UserProfile.filter({ created_by: user.email }).then(p => p[0])
    ]);

    // Build context for AI
    const contextPrompt = `You are a smart recipe search assistant. Parse the user's natural language query and identify what they're looking for.

USER PROFILE:
${profile ? `
- Health Goal: ${profile.health_goal?.replace('_', ' ')}
- Daily Calorie Target: ${profile.daily_calorie_target} kcal
- Dietary Preferences: ${profile.dietary_preferences?.join(', ') || 'none'}
- Dislikes: ${profile.disliked_ingredients?.join(', ') || 'none'}
` : 'No profile available'}

AVAILABLE RECIPES: ${recipes.length} recipes in database

USER QUERY: "${query}"

Parse this query and return ONLY a JSON object with these fields:
{
  "searchTerms": ["array of keywords to search in recipe names/descriptions"],
  "meal_type": "breakfast|lunch|dinner|snack or null if not specified",
  "cuisine_type": "italian|mexican|chinese|indian|thai|japanese|mediterranean|american|french|greek|middle_eastern|korean|vietnamese|other or null",
  "dietary_tags": ["array of dietary requirements like vegan, vegetarian, gluten-free, dairy-free, etc."],
  "includeIngredients": ["ingredients that MUST be present"],
  "excludeIngredients": ["ingredients to EXCLUDE"],
  "maxPrepTime": number (max cooking time in minutes, or 180 for no limit),
  "maxCalories": number (max calories or 2000 for no limit),
  "sortBy": "calories|protein|prepTime|relevance"
}

Examples:
- "quick vegan dinner under 400 calories" → searchTerms: ["vegan"], meal_type: "dinner", dietary_tags: ["vegan"], maxCalories: 400, maxPrepTime: 30
- "high protein breakfast with eggs" → searchTerms: ["protein", "breakfast"], meal_type: "breakfast", includeIngredients: ["eggs"], sortBy: "protein"
- "italian pasta without cheese" → cuisine_type: "italian", searchTerms: ["pasta"], excludeIngredients: ["cheese"]
- "healthy chicken recipes" → searchTerms: ["healthy", "chicken"], includeIngredients: ["chicken"], sortBy: "relevance"`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: contextPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          searchTerms: { type: "array", items: { type: "string" } },
          meal_type: { type: "string" },
          cuisine_type: { type: "string" },
          dietary_tags: { type: "array", items: { type: "string" } },
          includeIngredients: { type: "array", items: { type: "string" } },
          excludeIngredients: { type: "array", items: { type: "string" } },
          maxPrepTime: { type: "number" },
          maxCalories: { type: "number" },
          sortBy: { type: "string" }
        }
      }
    });

    // Filter recipes based on AI-parsed criteria
    let filteredRecipes = recipes.filter(recipe => {
      // Search terms
      if (aiResponse.searchTerms?.length > 0) {
        const recipeText = `${recipe.name} ${recipe.description || ''}`.toLowerCase();
        const matchesSearch = aiResponse.searchTerms.some(term => 
          recipeText.includes(term.toLowerCase())
        );
        if (!matchesSearch) return false;
      }

      // Meal type
      if (aiResponse.meal_type && aiResponse.meal_type !== 'null') {
        if (recipe.meal_type !== aiResponse.meal_type) return false;
      }

      // Cuisine type
      if (aiResponse.cuisine_type && aiResponse.cuisine_type !== 'null') {
        if (recipe.cuisine_type !== aiResponse.cuisine_type) return false;
      }

      // Dietary tags
      if (aiResponse.dietary_tags?.length > 0) {
        const hasDietaryMatch = aiResponse.dietary_tags.every(tag => 
          recipe.dietary_tags?.some(rt => rt.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasDietaryMatch) return false;
      }

      // Ingredients
      const recipeIngredients = recipe.ingredients?.map(i => i.toLowerCase()).join(' ') || '';
      
      if (aiResponse.includeIngredients?.length > 0) {
        const hasAllIngredients = aiResponse.includeIngredients.every(ing => 
          recipeIngredients.includes(ing.toLowerCase())
        );
        if (!hasAllIngredients) return false;
      }

      if (aiResponse.excludeIngredients?.length > 0) {
        const hasExcludedIngredient = aiResponse.excludeIngredients.some(ing => 
          recipeIngredients.includes(ing.toLowerCase())
        );
        if (hasExcludedIngredient) return false;
      }

      // Time and calories
      const totalTime = (recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0);
      if (aiResponse.maxPrepTime && aiResponse.maxPrepTime < 180) {
        if (totalTime > aiResponse.maxPrepTime) return false;
      }

      if (aiResponse.maxCalories && aiResponse.maxCalories < 2000) {
        if (recipe.calories > aiResponse.maxCalories) return false;
      }

      return true;
    });

    // Sort results
    if (aiResponse.sortBy === 'calories') {
      filteredRecipes.sort((a, b) => a.calories - b.calories);
    } else if (aiResponse.sortBy === 'protein') {
      filteredRecipes.sort((a, b) => b.protein_g - a.protein_g);
    } else if (aiResponse.sortBy === 'prepTime') {
      filteredRecipes.sort((a, b) => 
        ((a.prep_time_mins || 0) + (a.cook_time_mins || 0)) - 
        ((b.prep_time_mins || 0) + (b.cook_time_mins || 0))
      );
    }

    return Response.json({
      recipes: filteredRecipes.slice(0, 20),
      filters: aiResponse,
      totalResults: filteredRecipes.length
    });

  } catch (error) {
    console.error('Error in smart recipe search:', error);
    return Response.json({ 
      error: error.message || 'Failed to process search' 
    }, { status: 500 });
  }
});