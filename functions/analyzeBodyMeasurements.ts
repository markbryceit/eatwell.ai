import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return Response.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Get user profile for context
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    const profile = profiles[0];

    const analysisPrompt = `You are an expert body composition analyst. Analyze this body photo and provide detailed, CONSISTENT body composition and measurement estimates.

CRITICAL INSTRUCTIONS FOR CONSISTENCY:
- Use a systematic, reproducible methodology for every analysis
- Base body fat percentage primarily on visible muscle definition and fat distribution patterns
- Consider anthropometric proportions relative to the person's height and weight
- Use the Navy Method formula as a cross-reference for validation
- Your estimates should be within ±1% if the same photo is analyzed multiple times

Person's Profile:
${profile ? `Gender: ${profile.gender}, Height: ${profile.height_cm}cm, Current Weight: ${profile.weight_kg}kg` : 'No profile data available'}

Estimate the following:
1. Body fat percentage - Use these visual cues systematically:
   - Muscle definition visibility (abs, striations, vascularity)
   - Fat accumulation areas (waist, hips, thighs, arms, face)
   - Overall body shape and proportion
   ${profile?.gender === 'male' ? '- For males: 6-13% (athletic), 14-17% (fit), 18-24% (average), 25%+ (above average)' : ''}
   ${profile?.gender === 'female' ? '- For females: 14-20% (athletic), 21-24% (fit), 25-31% (average), 32%+ (above average)' : ''}

2. Body measurements in inches (use proportions relative to height):
   - Chest, waist, hips, thighs, arms, neck circumferences

Return ONLY a JSON object with this exact structure:
{
  "body_fat_percentage": <number with 1 decimal place>,
  "measurements": {
    "chest_inches": <number>,
    "waist_inches": <number>,
    "hips_inches": <number>,
    "thighs_inches": <number>,
    "arms_inches": <number>,
    "neck_inches": <number>
  },
  "analysis_notes": "Brief, objective observations about body composition, muscle definition, and fat distribution"
}

IMPORTANT: Be consistent and systematic. The same photo should produce nearly identical results.`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          body_fat_percentage: {
            type: "number"
          },
          measurements: {
            type: "object",
            properties: {
              chest_inches: { type: "number" },
              waist_inches: { type: "number" },
              hips_inches: { type: "number" },
              thighs_inches: { type: "number" },
              arms_inches: { type: "number" },
              neck_inches: { type: "number" }
            }
          },
          analysis_notes: {
            type: "string"
          }
        }
      }
    });

    return Response.json({
      body_fat_percentage: analysis.body_fat_percentage,
      measurements: analysis.measurements,
      analysis_notes: analysis.analysis_notes
    });

  } catch (error) {
    console.error('Error analyzing body measurements:', error);
    return Response.json({ 
      error: error.message || 'Failed to analyze body measurements' 
    }, { status: 500 });
  }
});