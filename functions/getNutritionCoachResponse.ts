import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format, subDays } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch user's data for context
    const [profile, foodLogs, fastingLogs, calorieLogs, recipes] = await Promise.all([
      base44.entities.UserProfile.filter({ created_by: user.email }).then(p => p[0]),
      base44.entities.FoodLog.filter({ created_by: user.email }),
      base44.entities.FastingLog.filter({ created_by: user.email }),
      base44.entities.CalorieLog.filter({ created_by: user.email }),
      base44.asServiceRole.entities.Recipe.list()
    ]);

    // Get recent logs (last 7 days)
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const recentFoodLogs = foodLogs.filter(log => log.date >= sevenDaysAgo);
    const recentCalorieLogs = calorieLogs.filter(log => log.date >= sevenDaysAgo);
    const recentFastingLogs = fastingLogs
      .filter(log => log.start_time >= subDays(new Date(), 7).toISOString())
      .slice(0, 10);

    // Calculate comprehensive stats
    const totalCaloriesWeek = recentCalorieLogs.reduce((sum, log) => sum + (log.calories_consumed || 0), 0);
    const avgCaloriesPerDay = recentCalorieLogs.length > 0 ? Math.round(totalCaloriesWeek / recentCalorieLogs.length) : 0;
    
    const completedFasts = recentFastingLogs.filter(f => f.status === 'completed');
    const avgFastDuration = completedFasts.length > 0 
      ? Math.round(completedFasts.reduce((sum, f) => sum + (f.duration_hours || 0), 0) / completedFasts.length)
      : 0;

    // Macro analysis
    const totalProtein = recentFoodLogs.reduce((sum, log) => sum + (log.protein_g || 0), 0);
    const totalCarbs = recentFoodLogs.reduce((sum, log) => sum + (log.carbs_g || 0), 0);
    const totalFat = recentFoodLogs.reduce((sum, log) => sum + (log.fat_g || 0), 0);
    const totalFiber = recentFoodLogs.reduce((sum, log) => sum + (log.fiber_g || 0), 0);

    const avgProtein = recentCalorieLogs.length > 0 ? Math.round(totalProtein / recentCalorieLogs.length) : 0;
    const avgCarbs = recentCalorieLogs.length > 0 ? Math.round(totalCarbs / recentCalorieLogs.length) : 0;
    const avgFat = recentCalorieLogs.length > 0 ? Math.round(totalFat / recentCalorieLogs.length) : 0;
    const avgFiber = recentCalorieLogs.length > 0 ? Math.round(totalFiber / recentCalorieLogs.length) : 0;

    // Identify potential deficiencies
    const proteinTarget = profile?.health_goal === 'gain_muscle' 
      ? (profile?.weight_kg || 70) * 2 
      : (profile?.weight_kg || 70) * 1.6;
    const fiberTarget = 25;
    
    const deficiencies = [];
    if (avgProtein < proteinTarget * 0.8) deficiencies.push(`protein (${avgProtein}g vs ${Math.round(proteinTarget)}g target)`);
    if (avgFiber < fiberTarget) deficiencies.push(`fiber (${avgFiber}g vs ${fiberTarget}g target)`);
    
    // Meal consistency
    const mealTypes = recentFoodLogs.reduce((acc, log) => {
      acc[log.meal_type] = (acc[log.meal_type] || 0) + 1;
      return acc;
    }, {});
    
    const mostCommonMeal = Object.entries(mealTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'not tracked';

    // Build context for AI
    const contextPrompt = `You are an expert AI Nutrition Coach helping ${user.full_name}. Be supportive, knowledgeable, and personalized.

USER PROFILE:
- Gender: ${profile?.gender || 'not specified'}
- Age: ${profile?.age || 'not specified'}
- Height: ${profile?.height_cm || 'not specified'} cm
- Weight: ${profile?.weight_kg || 'not specified'} kg
- Daily Calorie Target: ${profile?.daily_calorie_target || 'not specified'} kcal
- Health Goal: ${profile?.health_goal?.replace('_', ' ') || 'not specified'}
- Activity Level: ${profile?.activity_level?.replace('_', ' ') || 'not specified'}
- Dietary Preferences: ${profile?.dietary_preferences?.join(', ') || 'none specified'}
${profile?.disliked_ingredients?.length > 0 ? `- Dislikes: ${profile.disliked_ingredients.join(', ')}` : ''}

RECENT ACTIVITY (Last 7 Days):
- Average Daily Calories: ${avgCaloriesPerDay} kcal (Target: ${profile?.daily_calorie_target || 'N/A'} kcal)
- Days Tracked: ${recentCalorieLogs.length}
- Food Logs: ${recentFoodLogs.length} meals logged (most common: ${mostCommonMeal})
${avgFastDuration > 0 ? `- Intermittent Fasting: ${completedFasts.length} fasts completed, avg ${avgFastDuration}hrs` : ''}

MACRO ANALYSIS (Daily Averages):
- Protein: ${avgProtein}g (Target: ${Math.round(proteinTarget)}g)
- Carbs: ${avgCarbs}g
- Fat: ${avgFat}g
- Fiber: ${avgFiber}g (Target: ${fiberTarget}g)
${deficiencies.length > 0 ? `\n⚠️ POTENTIAL DEFICIENCIES: ${deficiencies.join(', ')}` : ''}

AVAILABLE RECIPES: ${recipes.length} recipes available in the system covering breakfast, lunch, dinner, and snacks.

INSTRUCTIONS:
1. Provide personalized dietary advice based on the user's goals, current stats, and recent activity
2. Address any identified deficiencies with specific, actionable recommendations
3. Suggest specific recipes from the database when relevant (mention recipe names)
4. Give actionable tips for achieving their health goals
5. Analyze patterns in their eating habits and suggest improvements
6. Be encouraging and motivational but also honest about areas needing improvement
7. Keep responses concise but informative
8. When discussing macros, explain WHY they're important for the user's specific goal

User's Question: ${message}`;

    // Get AI response
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: contextPrompt,
      add_context_from_internet: false
    });

    return Response.json({
      response: aiResponse,
      stats: {
        avgCaloriesPerDay,
        daysTracked: recentCalorieLogs.length,
        avgFastDuration,
        fastsCompleted: completedFasts.length
      }
    });

  } catch (error) {
    console.error('Error in nutrition coach:', error);
    return Response.json({ 
      error: error.message || 'Failed to get coach response' 
    }, { status: 500 });
  }
});