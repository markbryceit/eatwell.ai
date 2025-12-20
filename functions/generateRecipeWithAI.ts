import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      ingredients, 
      dietary_restrictions, 
      cuisine_type, 
      target_calories,
      meal_type,
      exclude_ingredients,
      variation_of_recipe
    } = await req.json();

    let prompt = '';
    
    if (variation_of_recipe) {
      // Generate variation of existing recipe
      prompt = `Create a variation of this recipe:

ORIGINAL RECIPE:
Name: ${variation_of_recipe.name}
Description: ${variation_of_recipe.description || ''}
Meal Type: ${variation_of_recipe.meal_type}
Ingredients: ${variation_of_recipe.ingredients?.join(', ')}
Instructions: ${variation_of_recipe.instructions?.join(' ')}
Calories: ${variation_of_recipe.calories}
Macros: P:${variation_of_recipe.protein_g}g C:${variation_of_recipe.carbs_g}g F:${variation_of_recipe.fat_g}g

Create a similar but different version by:
- Swapping some ingredients with alternatives
- Adjusting cooking methods slightly
- Maintaining similar nutritional profile (±100 calories)
- Keeping the same meal type
${dietary_restrictions?.length ? `- Ensuring it meets: ${dietary_restrictions.join(', ')}` : ''}

Provide a complete new recipe with a creative name.`;
    } else {
      // Generate brand new recipe
      prompt = `Generate a detailed, healthy recipe based on these requirements:

REQUIREMENTS:
${ingredients?.length ? `- Must use these ingredients: ${ingredients.join(', ')}` : ''}
${exclude_ingredients?.length ? `- Must NOT contain: ${exclude_ingredients.join(', ')}` : ''}
${dietary_restrictions?.length ? `- Dietary requirements: ${dietary_restrictions.join(', ')}` : ''}
${cuisine_type ? `- Cuisine style: ${cuisine_type}` : ''}
${meal_type ? `- Meal type: ${meal_type}` : ''}
${target_calories ? `- Target calories: ${target_calories} kcal (±50 kcal tolerance)` : ''}

Create a complete, balanced, and delicious recipe that:
- Uses real, accessible ingredients
- Has clear, step-by-step instructions
- Includes accurate calorie and macro calculations
- Is practical to cook at home
- Meets all dietary requirements`;
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Creative recipe name" },
          description: { type: "string", description: "Brief appetizing description" },
          meal_type: { 
            type: "string", 
            enum: ["breakfast", "lunch", "dinner", "snack"],
            description: "Type of meal"
          },
          calories: { type: "number", description: "Total calories per serving" },
          protein_g: { type: "number", description: "Protein in grams" },
          carbs_g: { type: "number", description: "Carbohydrates in grams" },
          fat_g: { type: "number", description: "Fat in grams" },
          fiber_g: { type: "number", description: "Fiber in grams" },
          prep_time_mins: { type: "number", description: "Preparation time in minutes" },
          cook_time_mins: { type: "number", description: "Cooking time in minutes" },
          servings: { type: "number", description: "Number of servings" },
          ingredients: { 
            type: "array", 
            items: { type: "string" },
            description: "List of ingredients with quantities"
          },
          instructions: { 
            type: "array", 
            items: { type: "string" },
            description: "Step-by-step cooking instructions"
          },
          dietary_tags: {
            type: "array",
            items: { type: "string" },
            description: "Dietary tags like vegetarian, vegan, gluten-free, dairy-free, etc."
          },
          health_score: {
            type: "string",
            enum: ["green", "yellow", "red"],
            description: "Health rating: green=very healthy, yellow=moderate, red=indulgent"
          },
          cuisine_inspiration: {
            type: "string",
            description: "What cuisine inspired this recipe"
          }
        },
        required: ["name", "meal_type", "calories", "protein_g", "carbs_g", "fat_g", "ingredients", "instructions"]
      }
    });

    return Response.json({ 
      recipe: response,
      is_variation: !!variation_of_recipe
    });

  } catch (error) {
    console.error('Error generating recipe:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate recipe' 
    }, { status: 500 });
  }
});