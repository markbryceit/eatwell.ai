import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { location } = await req.json();

    if (!location) {
      return Response.json({ error: 'Location is required' }, { status: 400 });
    }

    const profile = await base44.entities.UserProfile.filter({ created_by: user.email }).then(p => p[0]);

    const dietaryInfo = [
      profile?.eating_style?.join(', '),
      profile?.allergies?.length > 0 ? `allergies: ${profile.allergies.join(', ')}` : null,
      profile?.intolerances?.length > 0 ? `intolerances: ${profile.intolerances.join(', ')}` : null,
      profile?.disliked_foods?.length > 0 ? `avoids: ${profile.disliked_foods.join(', ')}` : null,
    ].filter(Boolean).join('; ');

    const calorieTarget = profile?.daily_calorie_target || 2000;
    const healthGoal = profile?.health_goal?.replace('_', ' ') || 'healthy eating';

    const prompt = `Find real restaurants in "${location}" that are good for someone with the following profile:
- Health goal: ${healthGoal}
- Daily calorie target: ${calorieTarget} kcal (so a single meal should ideally be 400–700 kcal)
${dietaryInfo ? `- Dietary needs: ${dietaryInfo}` : '- No specific dietary restrictions'}

Please provide 4-5 specific real restaurants in that location. For each restaurant give:

### [Restaurant Name] — [Cuisine Type]
**Why it suits your goals:** (1-2 sentences)

**Sample menu items with nutrition estimates:**
List 4-6 real dishes from their menu with estimated calories, protein, carbs and fat per serving.

**🥗 Option A — Best Choice:**
Name the single best dish to order, explain why it fits their goals, give calorie + macro estimate, and suggest any modifications (e.g. "ask for dressing on the side").

**🥙 Option B — Runner Up:**
Name the second best dish, explain why, give calorie + macro estimate, and any smart modifications.

**💡 Ordering Tip:** One practical tip for this specific restaurant.

---

Be specific to the actual location "${location}". Only suggest real restaurants that genuinely exist there. Use your knowledge of their actual menus.`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true
    });

    return Response.json({ results: response, location });

  } catch (error) {
    console.error('Error finding dining options:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});