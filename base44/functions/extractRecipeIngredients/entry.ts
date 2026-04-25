import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipe_text, ingredients_text } = await req.json();

    if (!recipe_text && !ingredients_text) {
      return Response.json({ error: 'Recipe text or ingredients text required' }, { status: 400 });
    }

    const textToAnalyze = ingredients_text || recipe_text;

    const prompt = `Analyze this recipe text and extract all ingredients with their quantities and units.

RECIPE TEXT:
${textToAnalyze}

For each ingredient, extract:
1. The ingredient name (e.g., "chicken breast", "olive oil", "garlic")
2. The quantity (e.g., 2, 1.5, 1/2, "a pinch")
3. The unit (e.g., "cups", "tbsp", "oz", "lbs", "whole", "cloves")
4. The category (protein, vegetable, fruit, grain, dairy, spice, oil, other)

Be smart about:
- Converting informal measurements (e.g., "a dash" → "pinch")
- Handling fractional amounts (e.g., "1/2 cup" or "half cup")
- Identifying preparation methods but keeping them separate (e.g., "diced onion" → ingredient: "onion", prep: "diced")
- Grouping similar items (e.g., all spices together)`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Ingredient name" },
                quantity: { type: "string", description: "Amount needed (e.g., '2', '1/2', '1.5')" },
                unit: { type: "string", description: "Unit of measurement (e.g., 'cups', 'tbsp', 'whole')" },
                category: { 
                  type: "string", 
                  enum: ["protein", "vegetable", "fruit", "grain", "dairy", "spice", "oil", "condiment", "other"],
                  description: "Ingredient category"
                },
                preparation: { type: "string", description: "Optional preparation method (e.g., 'diced', 'minced')" },
                optional: { type: "boolean", description: "Whether ingredient is optional" }
              },
              required: ["name", "quantity", "unit", "category"]
            }
          },
          formatted_list: {
            type: "array",
            items: { type: "string" },
            description: "Human-readable ingredient list (e.g., '2 cups diced chicken breast')"
          }
        },
        required: ["ingredients", "formatted_list"]
      }
    });

    return Response.json(response);

  } catch (error) {
    console.error('Error extracting ingredients:', error);
    return Response.json({ 
      error: error.message || 'Failed to extract ingredients' 
    }, { status: 500 });
  }
});