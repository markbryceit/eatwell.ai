import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's pantry
    const pantryRecords = await base44.entities.Pantry.filter({ created_by: user.email });
    const pantry = pantryRecords[0];
    const ingredients = pantry?.ingredients || [];

    if (ingredients.length === 0) {
      return Response.json({ recipes: [], message: 'No ingredients found in pantry.' });
    }

    // Fetch user profile for dietary preferences
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    const profile = profiles[0];

    const dietaryInfo = [];
    if (profile?.eating_style?.length) dietaryInfo.push(`Eating style: ${profile.eating_style.join(', ')}`);
    if (profile?.allergies?.length) dietaryInfo.push(`Allergies (avoid): ${profile.allergies.join(', ')}`);
    if (profile?.intolerances?.length) dietaryInfo.push(`Intolerances (avoid): ${profile.intolerances.join(', ')}`);
    if (profile?.disliked_foods?.length) dietaryInfo.push(`Dislikes: ${profile.disliked_foods.join(', ')}`);
    if (profile?.max_cooking_time_mins) dietaryInfo.push(`Max cooking time: ${profile.max_cooking_time_mins} minutes`);
    if (profile?.cooking_skill_level) dietaryInfo.push(`Skill level: ${profile.cooking_skill_level}`);
    if (profile?.daily_calorie_target) dietaryInfo.push(`Daily calorie target: ${profile.daily_calorie_target} kcal`);

    const prompt = `You are a creative chef helping someone reduce food waste by cooking with what they have.

The user currently has these ingredients in their pantry:
${ingredients.join(', ')}

${dietaryInfo.length > 0 ? `User preferences:\n${dietaryInfo.join('\n')}` : ''}

Generate 4 diverse recipe suggestions the user can make RIGHT NOW using primarily these ingredients. 
They may use basic pantry staples (salt, pepper, oil, water, basic spices) freely, but try to use what they have.
Focus on minimising food waste.

For each recipe, provide:
- A creative, appetising name
- Meal type (breakfast, lunch, dinner, or snack)
- Which of the user's listed ingredients it uses (list them)
- Any extra staples needed (just salt, oil, spices etc — nothing that requires a store trip)
- Estimated prep + cook time in minutes
- Estimated calories per serving
- A difficulty level (easy, medium, hard)
- A short 1-2 sentence description that makes it sound delicious
- Step-by-step cooking instructions (4-8 steps)
- A "waste score" from 1-5 (5 = uses the most pantry items, reduces most waste)`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recipes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                meal_type: { type: 'string' },
                description: { type: 'string' },
                ingredients_used: { type: 'array', items: { type: 'string' } },
                extra_staples: { type: 'array', items: { type: 'string' } },
                prep_time_mins: { type: 'number' },
                cook_time_mins: { type: 'number' },
                calories: { type: 'number' },
                difficulty: { type: 'string' },
                instructions: { type: 'array', items: { type: 'string' } },
                waste_score: { type: 'number' }
              }
            }
          }
        }
      }
    });

    return Response.json({ recipes: result.recipes || [], pantry_count: ingredients.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});