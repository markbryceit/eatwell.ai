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
- Daily calorie target: ${calorieTarget} kcal
${dietaryInfo ? `- Dietary needs: ${dietaryInfo}` : '- No specific dietary restrictions'}

Please provide 5-6 specific real restaurants in that location. For each restaurant give:
- Name
- Cuisine type
- Why it's a good choice for this person's goals
- 2-3 specific healthy menu items they should order (with approximate calories if known)
- Tip for ordering healthily there

Be specific to the actual location "${location}". Only suggest real restaurants that exist there. Format as a helpful, easy-to-read guide.`;

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