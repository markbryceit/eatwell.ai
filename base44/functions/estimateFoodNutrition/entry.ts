import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { food_name, serving_size, brand } = await req.json();

    if (!food_name) {
      return Response.json({ error: 'Food name is required' }, { status: 400 });
    }

    const prompt = `Estimate the nutritional information for this food item:

Food: ${food_name}
${brand ? `Brand: ${brand}` : ''}
${serving_size ? `Serving Size: ${serving_size}` : 'Serving Size: Standard/typical portion'}

Provide accurate nutritional estimates based on:
- Standard nutritional databases
- Typical preparation methods
- Common serving sizes

Be as accurate as possible. If the serving size is unclear, use a typical serving.
Consider the brand if provided, as branded items may differ from generic.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          food_name: { 
            type: "string",
            description: "Cleaned/standardized food name"
          },
          serving_size: { 
            type: "string",
            description: "Standardized serving size description"
          },
          calories: { 
            type: "number",
            description: "Estimated calories per serving"
          },
          protein_g: { 
            type: "number",
            description: "Protein in grams"
          },
          carbs_g: { 
            type: "number",
            description: "Carbohydrates in grams"
          },
          fat_g: { 
            type: "number",
            description: "Fat in grams"
          },
          fiber_g: { 
            type: "number",
            description: "Fiber in grams"
          },
          sugar_g: { 
            type: "number",
            description: "Sugar in grams"
          },
          sodium_mg: { 
            type: "number",
            description: "Sodium in milligrams"
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Confidence level of the estimate"
          },
          notes: {
            type: "string",
            description: "Any relevant notes about the estimate"
          }
        },
        required: ["food_name", "serving_size", "calories", "protein_g", "carbs_g", "fat_g"]
      }
    });

    return Response.json({
      estimated: true,
      ...response
    });

  } catch (error) {
    console.error('Error estimating nutrition:', error);
    return Response.json({ 
      error: error.message || 'Failed to estimate nutrition'
    }, { status: 500 });
  }
});