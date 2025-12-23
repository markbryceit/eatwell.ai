import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      recipe, 
      ingredient_to_substitute,
      dietary_restrictions,
      reason 
    } = await req.json();

    if (!recipe) {
      return Response.json({ error: 'Recipe required' }, { status: 400 });
    }

    let prompt = '';

    if (ingredient_to_substitute) {
      // Specific ingredient substitution
      prompt = `Suggest substitutions for "${ingredient_to_substitute}" in this recipe:

RECIPE: ${recipe.name}
INGREDIENTS: ${recipe.ingredients?.join(', ')}
MEAL TYPE: ${recipe.meal_type}
${dietary_restrictions?.length ? `DIETARY NEEDS: ${dietary_restrictions.join(', ')}` : ''}
${reason ? `REASON FOR SUBSTITUTION: ${reason}` : ''}

Provide 3-5 suitable substitutions that:
- Maintain the recipe's flavor profile
- Keep similar nutritional values
- Are commonly available
- Work with the cooking method
${dietary_restrictions?.length ? `- Meet dietary restrictions: ${dietary_restrictions.join(', ')}` : ''}

For each substitution, explain:
1. What to substitute and in what ratio (e.g., "Replace 1:1" or "Use 2x amount")
2. How it affects taste/texture
3. Any cooking adjustments needed
4. Nutritional impact`;
    } else {
      // General recipe variations and substitutions
      prompt = `Suggest creative variations and common substitutions for this recipe:

RECIPE: ${recipe.name}
DESCRIPTION: ${recipe.description || ''}
INGREDIENTS: ${recipe.ingredients?.join(', ')}
INSTRUCTIONS: ${recipe.instructions?.join(' ')}
MEAL TYPE: ${recipe.meal_type}
CALORIES: ${recipe.calories}
${dietary_restrictions?.length ? `DIETARY NEEDS: ${dietary_restrictions.join(', ')}` : ''}

Provide:
1. 3 creative variations of this recipe (e.g., different protein, cooking method, flavor profile)
2. Common ingredient substitutions for dietary needs or preferences
3. Tips to make it healthier, faster, or more flavorful
${dietary_restrictions?.length ? `4. Specific adaptations for: ${dietary_restrictions.join(', ')}` : ''}`;
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          substitutions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                original_ingredient: { type: "string" },
                substitute: { type: "string" },
                ratio: { type: "string", description: "e.g., '1:1', '2:1', 'use half'" },
                taste_impact: { type: "string" },
                cooking_adjustments: { type: "string" },
                nutritional_notes: { type: "string" }
              }
            }
          },
          variations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                key_changes: {
                  type: "array",
                  items: { type: "string" }
                },
                difficulty_change: { type: "string", enum: ["easier", "same", "harder"] }
              }
            }
          },
          tips: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string", enum: ["healthier", "faster", "budget", "flavor"] },
                tip: { type: "string" }
              }
            }
          }
        },
        required: ["substitutions"]
      }
    });

    return Response.json(response);

  } catch (error) {
    console.error('Error suggesting substitutions:', error);
    return Response.json({ 
      error: error.message || 'Failed to suggest substitutions' 
    }, { status: 500 });
  }
});