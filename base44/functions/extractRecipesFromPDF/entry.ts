import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { file_url } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Extract recipe data from PDF using AI
    const extractionResult = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          recipes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                meal_type: { 
                  type: "string",
                  enum: ["breakfast", "lunch", "dinner", "snack"]
                },
                calories: { type: "number" },
                protein_g: { type: "number" },
                carbs_g: { type: "number" },
                fat_g: { type: "number" },
                fiber_g: { type: "number" },
                prep_time_mins: { type: "number" },
                cook_time_mins: { type: "number" },
                servings: { type: "number" },
                ingredients: {
                  type: "array",
                  items: { type: "string" }
                },
                instructions: {
                  type: "array",
                  items: { type: "string" }
                },
                dietary_tags: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["name", "meal_type", "calories", "protein_g", "carbs_g", "fat_g"]
            }
          }
        },
        required: ["recipes"]
      }
    });

    if (extractionResult.status === 'error') {
      return Response.json({ 
        error: 'Failed to extract recipes from PDF',
        details: extractionResult.details 
      }, { status: 400 });
    }

    const recipes = extractionResult.output?.recipes || [];

    if (recipes.length === 0) {
      return Response.json({ 
        error: 'No recipes found in PDF' 
      }, { status: 400 });
    }

    // Process recipes to extract/generate images
    const enrichedRecipes = await Promise.all(recipes.map(async (recipe) => {
      let imageUrl = recipe.image_url || null;
      
      // If no image exists, generate one using AI
      if (!imageUrl) {
        try {
          const imagePrompt = `A professional, appetizing food photography style image of ${recipe.name}. ${recipe.description || ''}. High quality, well-lit, restaurant presentation style.`;
          
          const generatedImage = await base44.asServiceRole.integrations.Core.GenerateImage({
            prompt: imagePrompt
          });
          
          imageUrl = generatedImage.url;
        } catch (error) {
          console.error(`Failed to generate image for ${recipe.name}:`, error);
          // Continue without image if generation fails
        }
      }
      
      return {
        ...recipe,
        health_score: recipe.health_score || 'green',
        image_url: imageUrl
      };
    }));

    // Create recipe records using service role
    const createdRecipes = await base44.asServiceRole.entities.Recipe.bulkCreate(enrichedRecipes);

    return Response.json({
      success: true,
      message: `Successfully imported ${createdRecipes.length} recipes`,
      recipes: createdRecipes
    });

  } catch (error) {
    console.error('Error extracting recipes from PDF:', error);
    return Response.json({ 
      success: false,
      error: error.message || 'Failed to process PDF',
      details: error.stack
    }, { status: 500 });
  }
});