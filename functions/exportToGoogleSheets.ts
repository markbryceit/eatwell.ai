import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { planData } = body;

    // Get Google Sheets access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

    // Create a new spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: `Dining Plan - ${planData.location} - ${new Date().toLocaleDateString()}`
        },
        sheets: [{
          properties: {
            title: 'Restaurants'
          }
        }]
      })
    });

    const spreadsheet = await createResponse.json();
    const spreadsheetId = spreadsheet.spreadsheetId;

    // Prepare data for the sheet
    const rows = [
      ['Restaurant', 'Cuisine', 'Rating', 'Distance', 'Meal Type', 'Dish', 'Calories', 'Protein', 'Carbs', 'Fat', 'Modifications']
    ];

    planData.restaurants?.forEach(restaurant => {
      restaurant.recommendations?.forEach(rec => {
        rows.push([
          restaurant.name,
          restaurant.cuisine_type || '',
          restaurant.rating || '',
          restaurant.distance || '',
          rec.meal_type || '',
          rec.dish_name || '',
          rec.nutrition?.calories || '',
          rec.nutrition?.protein || '',
          rec.nutrition?.carbs || '',
          rec.nutrition?.fat || '',
          rec.modifications || ''
        ]);
      });
    });

    // Update the sheet with data
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Restaurants!A1:K${rows.length}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    });

    // Format header row
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.7, blue: 0.6 },
                textFormat: {
                  bold: true,
                  foregroundColor: { red: 1, green: 1, blue: 1 }
                }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        }]
      })
    });

    return Response.json({
      success: true,
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});