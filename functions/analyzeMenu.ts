import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { imageUrl } = body;

    // Get user preferences
    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles[0];

    const dietaryPreferences = profile?.dietary_preferences?.join(', ') || 'whole foods';
    const dislikedIngredients = profile?.disliked_ingredients?.join(', ') || 'none';
    const calorieTarget = profile?.daily_calorie_target || 2000;

    const prompt = `You are a nutrition expert analyzing a restaurant menu photo.

User's dietary preferences: ${dietaryPreferences}
User's ingredients to avoid: ${dislikedIngredients}
User's daily calorie target: ${calorieTarget}

Analyze this menu and identify the 5-8 HEALTHIEST dishes that align with the user's preferences.

For each dish, provide:
1. Dish name (exact as appears on menu)
2. Why it's healthy (focus on whole foods, protein, nutrients)
3. Health score (1-10, where 10 is most nutritious)
4. Suggested modifications to make it even healthier
5. Estimated nutrition (calories, protein, carbs, fat)

Prioritize:
- Whole, unprocessed foods
- High protein options
- Vegetables and fiber
- Low added sugar
- Avoid fried foods unless it's the best option

Return JSON with this structure:
{
  "recommendations": [
    {
      "dish_name": "Grilled Chicken Salad",
      "reason": "High protein, loaded with vegetables, dressing on side",
      "health_score": 9,
      "modifications": "Ask for olive oil instead of creamy dressing",
      "nutrition": {
        "calories": 450,
        "protein": 40,
        "carbs": 25,
        "fat": 20
      }
    }
  ]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dish_name: { type: "string" },
                reason: { type: "string" },
                health_score: { type: "number" },
                modifications: { type: "string" },
                nutrition: {
                  type: "object",
                  properties: {
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" }
                  }
                }
              }
            }
          }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});