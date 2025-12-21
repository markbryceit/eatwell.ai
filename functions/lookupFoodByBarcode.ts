import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { barcode } = await req.json();

    if (!barcode) {
      return Response.json({ error: 'Barcode is required' }, { status: 400 });
    }

    // Use Open Food Facts API to look up product by barcode
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data = await response.json();

    if (data.status === 0 || !data.product) {
      return Response.json({ 
        found: false,
        message: 'Product not found in database'
      });
    }

    const product = data.product;
    const nutriments = product.nutriments || {};

    // Extract nutritional information
    const foodData = {
      found: true,
      food_name: product.product_name || 'Unknown Product',
      brand: product.brands || '',
      serving_size: product.serving_size || product.serving_quantity ? 
        `${product.serving_quantity || '100'}${product.serving_quantity_unit || 'g'}` : '100g',
      calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
      protein_g: parseFloat((nutriments['proteins_100g'] || nutriments['proteins'] || 0).toFixed(1)),
      carbs_g: parseFloat((nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || 0).toFixed(1)),
      fat_g: parseFloat((nutriments['fat_100g'] || nutriments['fat'] || 0).toFixed(1)),
      fiber_g: parseFloat((nutriments['fiber_100g'] || nutriments['fiber'] || 0).toFixed(1)),
      sugar_g: parseFloat((nutriments['sugars_100g'] || nutriments['sugars'] || 0).toFixed(1)),
      sodium_mg: Math.round(nutriments['sodium_100g'] ? nutriments['sodium_100g'] * 1000 : 
                           (nutriments['sodium'] || 0) * 1000),
      barcode: barcode,
      image_url: product.image_url || product.image_front_url || null
    };

    return Response.json(foodData);

  } catch (error) {
    console.error('Error looking up barcode:', error);
    return Response.json({ 
      error: error.message || 'Failed to lookup barcode',
      found: false
    }, { status: 500 });
  }
});