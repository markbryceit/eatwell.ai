import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt, dietary_preferences, disliked_ingredients, calorie_target } = await req.json();

        // Build context for AI
        let context = `User is looking for recipe ideas based on: "${prompt}"\n\n`;
        
        if (dietary_preferences && dietary_preferences.length > 0) {
            context += `Dietary preferences: ${dietary_preferences.join(', ')}\n`;
        }
        
        if (disliked_ingredients && disliked_ingredients.length > 0) {
            context += `Ingredients to avoid: ${disliked_ingredients.join(', ')}\n`;
        }
        
        context += `Daily calorie target: ${calorie_target} calories\n\n`;
        context += `Generate 6 diverse recipe suggestions that match the user's request. `;
        context += `Each suggestion should be creative, practical, and respect their dietary needs.`;

        const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: context,
            response_json_schema: {
                type: "object",
                properties: {
                    suggestions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                recipe_name: { type: "string" },
                                description: { type: "string" },
                                meal_type: { 
                                    type: "string",
                                    enum: ["breakfast", "lunch", "dinner", "snack"]
                                },
                                estimated_calories: { type: "number" },
                                key_ingredients: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                prep_time_mins: { type: "number" }
                            },
                            required: ["recipe_name", "description", "meal_type", "estimated_calories"]
                        }
                    }
                },
                required: ["suggestions"]
            }
        });

        return Response.json(response);
    } catch (error) {
        console.error('Error generating AI suggestions:', error);
        return Response.json({ 
            error: error.message || 'Failed to generate suggestions' 
        }, { status: 500 });
    }
});