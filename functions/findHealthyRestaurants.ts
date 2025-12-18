import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { location, hotelAddress, startDate, endDate, mealTypes } = body;

    // Get user preferences
    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles[0];

    const dietaryPreferences = profile?.dietary_preferences?.join(', ') || 'whole foods';
    const dislikedIngredients = profile?.disliked_ingredients?.join(', ') || 'none';

    // Use LLM to generate restaurant recommendations
    const prompt = `You are a nutrition expert helping someone find healthy restaurants.

Location: ${location}
Staying at: ${hotelAddress}
Dates: ${startDate} to ${endDate}
Meal types needed: ${mealTypes.join(', ')}
Dietary preferences: ${dietaryPreferences}
Ingredients to avoid: ${dislikedIngredients}

Find 10-12 healthy restaurants near the hotel. For each restaurant, recommend the HEALTHIEST dish available for the requested meal types.

Criteria for healthy choices:
- Whole foods (unprocessed)
- No added sugar
- Avoid refined carbs
- High protein
- Rich in nutrients
- Suggest modifications if needed (e.g., "ask for dressing on the side", "swap fries for vegetables")

Return JSON with this structure:
{
  "restaurants": [
    {
      "name": "Restaurant Name",
      "cuisine_type": "Italian",
      "rating": 4.5,
      "distance": "0.3 miles",
      "price_range": "$$",
      "recommendations": [
        {
          "meal_type": "breakfast",
          "dish_name": "Dish name",
          "description": "Brief description",
          "modifications": "Suggested modifications",
          "nutrition": {
            "calories": 450,
            "protein": 35,
            "carbs": 40,
            "fat": 15
          }
        }
      ]
    }
  ]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          restaurants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                cuisine_type: { type: "string" },
                rating: { type: "number" },
                distance: { type: "string" },
                price_range: { type: "string" },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      meal_type: { type: "string" },
                      dish_name: { type: "string" },
                      description: { type: "string" },
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