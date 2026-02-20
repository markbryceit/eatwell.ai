import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurant_name, menu_text } = await req.json();

    if (!menu_text && !restaurant_name) {
      return Response.json({ error: 'Restaurant name or menu text is required' }, { status: 400 });
    }

    const profile = await base44.entities.UserProfile.filter({ created_by: user.email }).then(p => p[0]);

    const dietaryInfo = [
      profile?.eating_style?.length > 0 ? `eating style: ${profile.eating_style.join(', ')}` : null,
      profile?.allergies?.length > 0 ? `allergies: ${profile.allergies.join(', ')}` : null,
      profile?.intolerances?.length > 0 ? `intolerances: ${profile.intolerances.join(', ')}` : null,
      profile?.disliked_foods?.length > 0 ? `avoids: ${profile.disliked_foods.join(', ')}` : null,
    ].filter(Boolean).join('; ');

    const calorieTarget = profile?.daily_calorie_target || 2000;
    const healthGoal = profile?.health_goal?.replace(/_/g, ' ') || 'healthy eating';

    const menuSection = menu_text
      ? `Here is the menu:\n\n${menu_text}`
      : `Look up the menu for "${restaurant_name}" and use it as the basis for your analysis.`;

    const prompt = `You are a nutrition expert helping someone make healthy choices when dining out.

${restaurant_name ? `Restaurant: ${restaurant_name}` : ''}
${menuSection}

The user's profile:
- Health goal: ${healthGoal}
- Daily calorie target: ${calorieTarget} kcal per day (so a meal should ideally be 400–700 kcal)
${dietaryInfo ? `- Dietary needs: ${dietaryInfo}` : '- No specific dietary restrictions'}

Please provide:

## ✅ Best Choices
List the top 3–5 healthiest menu items for this person, with:
- Why it's a good choice
- Estimated calories (if not on menu, give a realistic estimate)
- Macro breakdown estimate (protein / carbs / fat)

## ⚠️ Items to Approach with Caution
List 2–3 items that look healthy but may not be, and explain why.

## 🔄 Smart Modifications
For 3–4 popular or tempting dishes, give specific modifications to make them healthier:
- e.g. "Ask for the dressing on the side", "Swap fries for salad", "Request sauce-free", "Choose grilled instead of fried"

## 💡 General Tips for This Restaurant
2–3 practical tips for ordering well here, tailored to the user's goals.

Be practical, specific, and encouraging. Use the menu provided or your knowledge of this restaurant's typical menu.`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: !menu_text // use internet only if no menu was pasted
    });

    return Response.json({ results: response });

  } catch (error) {
    console.error('Error analyzing menu:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});