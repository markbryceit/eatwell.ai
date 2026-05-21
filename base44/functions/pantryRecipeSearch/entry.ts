import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pantry_ingredients } = await req.json();

    if (!pantry_ingredients || pantry_ingredients.length === 0) {
      return Response.json({ error: 'No pantry ingredients provided' }, { status: 400 });
    }

    // Get all recipes
    const recipes = await base44.asServiceRole.entities.Recipe.list();

    const pantryLower = pantry_ingredients.map(i => i.toLowerCase().trim());

    // Score each recipe by how many of its ingredients are in the pantry
    const scoredRecipes = recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients || [];
      if (recipeIngredients.length === 0) return null;

      let matchCount = 0;
      const missingIngredients = [];

      for (const ingredient of recipeIngredients) {
        const ingLower = ingredient.toLowerCase();
        // Check if any pantry item appears in this ingredient string
        const matched = pantryLower.some(pantryItem =>
          ingLower.includes(pantryItem) || pantryItem.includes(ingLower.split(' ')[0])
        );
        if (matched) {
          matchCount++;
        } else {
          missingIngredients.push(ingredient);
        }
      }

      const matchPercent = Math.round((matchCount / recipeIngredients.length) * 100);

      return {
        ...recipe,
        matchPercent,
        matchCount,
        missingIngredients,
        totalIngredients: recipeIngredients.length
      };
    }).filter(Boolean);

    // Only return recipes where user has at least 50% of ingredients, sorted by best match
    const goodMatches = scoredRecipes
      .filter(r => r.matchPercent >= 50)
      .sort((a, b) => b.matchPercent - a.matchPercent);

    return Response.json({
      recipes: goodMatches.slice(0, 30),
      totalResults: goodMatches.length
    });

  } catch (error) {
    console.error('Pantry search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});