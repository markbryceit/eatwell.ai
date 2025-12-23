import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Average grocery prices (USD) - based on typical US grocery costs
const priceDatabase = {
  // Proteins
  'chicken': { min: 3.5, max: 6.0, unit: 'lb', avgQty: 1 },
  'beef': { min: 5.0, max: 9.0, unit: 'lb', avgQty: 1 },
  'pork': { min: 3.0, max: 6.0, unit: 'lb', avgQty: 1 },
  'turkey': { min: 4.0, max: 7.0, unit: 'lb', avgQty: 1 },
  'salmon': { min: 8.0, max: 14.0, unit: 'lb', avgQty: 0.5 },
  'fish': { min: 6.0, max: 12.0, unit: 'lb', avgQty: 0.5 },
  'eggs': { min: 2.5, max: 5.0, unit: 'dozen', avgQty: 1 },
  'tofu': { min: 2.0, max: 4.0, unit: 'pack', avgQty: 1 },
  
  // Dairy
  'milk': { min: 2.5, max: 4.5, unit: 'gallon', avgQty: 0.5 },
  'cheese': { min: 3.0, max: 7.0, unit: 'pack', avgQty: 1 },
  'yogurt': { min: 3.0, max: 6.0, unit: 'pack', avgQty: 1 },
  'butter': { min: 3.0, max: 5.0, unit: 'stick', avgQty: 1 },
  'cream': { min: 2.5, max: 4.5, unit: 'pint', avgQty: 1 },
  
  // Vegetables
  'lettuce': { min: 1.5, max: 3.0, unit: 'head', avgQty: 1 },
  'tomato': { min: 2.0, max: 4.0, unit: 'lb', avgQty: 1 },
  'onion': { min: 1.0, max: 2.5, unit: 'lb', avgQty: 1 },
  'carrot': { min: 1.5, max: 3.0, unit: 'lb', avgQty: 1 },
  'pepper': { min: 2.5, max: 4.5, unit: 'lb', avgQty: 0.5 },
  'spinach': { min: 2.0, max: 4.0, unit: 'pack', avgQty: 1 },
  'broccoli': { min: 1.5, max: 3.5, unit: 'lb', avgQty: 1 },
  'cucumber': { min: 1.0, max: 2.5, unit: 'each', avgQty: 2 },
  'potato': { min: 2.0, max: 4.0, unit: 'lb', avgQty: 2 },
  
  // Fruits
  'apple': { min: 1.5, max: 3.0, unit: 'lb', avgQty: 1 },
  'banana': { min: 0.5, max: 1.5, unit: 'lb', avgQty: 1 },
  'orange': { min: 1.0, max: 2.5, unit: 'lb', avgQty: 1 },
  'berry': { min: 3.0, max: 6.0, unit: 'pack', avgQty: 1 },
  'strawberr': { min: 3.0, max: 6.0, unit: 'pack', avgQty: 1 },
  'blueberr': { min: 3.5, max: 7.0, unit: 'pack', avgQty: 1 },
  'grape': { min: 2.5, max: 5.0, unit: 'lb', avgQty: 1 },
  'lemon': { min: 1.0, max: 2.0, unit: 'lb', avgQty: 0.5 },
  
  // Grains
  'rice': { min: 2.0, max: 4.0, unit: 'lb', avgQty: 2 },
  'bread': { min: 2.0, max: 4.5, unit: 'loaf', avgQty: 1 },
  'pasta': { min: 1.5, max: 3.0, unit: 'box', avgQty: 1 },
  'flour': { min: 2.5, max: 5.0, unit: 'bag', avgQty: 1 },
  'oats': { min: 3.0, max: 6.0, unit: 'container', avgQty: 1 },
  
  // Default for unknown items
  'default': { min: 2.0, max: 5.0, unit: 'item', avgQty: 1 }
};

function estimateItemCost(itemName) {
  const name = itemName.toLowerCase();
  
  // Find matching category in price database
  for (const [key, priceInfo] of Object.entries(priceDatabase)) {
    if (name.includes(key)) {
      return priceInfo;
    }
  }
  
  return priceDatabase.default;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return Response.json({ error: 'Items array required' }, { status: 400 });
    }

    let minTotal = 0;
    let maxTotal = 0;
    const itemizedEstimates = [];

    items.forEach(item => {
      const priceInfo = estimateItemCost(item.name);
      const quantity = item.quantity || 1;
      const actualQty = priceInfo.avgQty * quantity;
      
      const minCost = priceInfo.min * actualQty;
      const maxCost = priceInfo.max * actualQty;
      const avgCost = (minCost + maxCost) / 2;
      
      minTotal += minCost;
      maxTotal += maxCost;
      
      itemizedEstimates.push({
        name: item.name,
        quantity: quantity,
        estimated_cost: avgCost,
        price_range: `$${minCost.toFixed(2)} - $${maxCost.toFixed(2)}`,
        unit: priceInfo.unit
      });
    });

    const estimatedTotal = (minTotal + maxTotal) / 2;

    return Response.json({
      estimated_total: estimatedTotal,
      min_total: minTotal,
      max_total: maxTotal,
      item_count: items.length,
      itemized_estimates: itemizedEstimates,
      disclaimer: 'Prices are estimates based on typical grocery costs and may vary by location, store, and brand.',
      currency: 'USD'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});