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

    const analysisPrompt = `Analyze this body photo and provide detailed body composition and measurement estimates.

Based on the photo, estimate:
1. Body fat percentage (as a number, e.g., 18.5 for 18.5%)
2. Body measurements in inches for:
   - Chest circumference
   - Waist circumference
   - Hip circumference
   - Thigh circumference (one leg)
   - Upper arm circumference (one arm)
   - Neck circumference

Context about the person:
${profile ? `Gender: ${profile.gender}, Height: ${profile.height_cm}cm, Current Weight: ${profile.weight_kg}kg` : 'No profile data available'}

Return ONLY a JSON object with this exact structure:
{
  "body_fat_percentage": <number>,
  "measurements": {
    "chest_inches": <number>,
    "waist_inches": <number>,
    "hips_inches": <number>,
    "thighs_inches": <number>,
    "arms_inches": <number>,
    "neck_inches": <number>
  },
  "analysis_notes": "Brief observations about body composition and posture"
}

Be as accurate as possible based on visual cues. If certain measurements are not clearly visible, make reasonable estimates based on proportions.`;

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