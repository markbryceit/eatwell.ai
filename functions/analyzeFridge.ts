import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return Response.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Get user profile for dietary preferences
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    const profile = profiles[0];

    // Analyze the fridge image with AI
    const ingredientsPrompt = `Analyze this fridge/pantry image and list ALL visible food items and ingredients you can identify. 
    
Return a JSON object with this structure:
{
  "ingredients": ["ingredient1", "ingredient2", ...],
  "categories": {
    "proteins": ["chicken", "eggs", ...],
    "vegetables": ["tomatoes", "lettuce", ...],
    "fruits": ["apples", "bananas", ...],
    "dairy": ["milk", "cheese", ...],
    "grains": ["bread", "pasta", ...],
    "condiments": ["ketchup", "mayo", ...],
    "other": ["..."]
  }
}

Be thorough and list everything you can see.`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: ingredientsPrompt,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          ingredients: {
            type: "array",
            items: { type: "string" }
          },
          categories: {
            type: "object",
            properties: {
              proteins: { type: "array", items: { type: "string" } },
              vegetables: { type: "array", items: { type: "string" } },
              fruits: { type: "array", items: { type: "string" } },
              dairy: { type: "array", items: { type: "string" } },
              grains: { type: "array", items: { type: "string" } },
              condiments: { type: "array", items: { type: "string" } },
              other: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    });

    // Get all recipes
    const recipes = await base44.asServiceRole.entities.Recipe.list();

    // Match recipes with available ingredients
    const matchedRecipes = recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients?.map(i => i.toLowerCase()) || [];
      const availableIngredients = analysis.ingredients.map(i => i.toLowerCase());
      
      // Count how many recipe ingredients are available
      const matches = recipeIngredients.filter(ri => 
        availableIngredients.some(ai => 
          ri.includes(ai) || ai.includes(ri.split(' ')[0])
        )
      );
      
      const matchPercentage = recipeIngredients.length > 0 
        ? Math.round((matches.length / recipeIngredients.length) * 100)
        : 0;

      return {
        recipe,
        matchPercentage,
        matchedIngredients: matches.length,
        totalIngredients: recipeIngredients.length,
        missingIngredients: recipeIngredients.filter(ri => !matches.includes(ri))
      };
    })
    .filter(r => r.matchPercentage >= 30) // At least 30% match
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 10);

    // Filter by dietary preferences if available
    let filteredRecipes = matchedRecipes;
    if (profile?.dietary_preferences?.length > 0) {
      const preferred = matchedRecipes.filter(r => 
        r.recipe.dietary_tags?.some(tag => 
          profile.dietary_preferences.includes(tag)
        )
      );
      if (preferred.length > 0) {
        filteredRecipes = preferred;
      }
    }

    return Response.json({
      ingredients: analysis.ingredients,
      categories: analysis.categories,
      suggestedRecipes: filteredRecipes
    });

  } catch (error) {
    console.error('Error analyzing fridge:', error);
    return Response.json({ 
      error: error.message || 'Failed to analyze fridge' 
    }, { status: 500 });
  }
});