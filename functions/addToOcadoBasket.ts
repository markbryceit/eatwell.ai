import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await req.json();

    // For now, we'll use Ocado's web interface approach
    // Build a search URL with all ingredients
    const searchTerms = items.map(item => item.name).join(', ');
    const ocadoSearchUrl = `https://www.ocado.com/search?entry=${encodeURIComponent(searchTerms)}`;

    // In the future, this can be enhanced with Ocado API integration if they provide one
    // For now, we'll open their search with all items and copy the detailed list
    
    return Response.json({
      success: true,
      basketUrl: ocadoSearchUrl,
      message: 'Opening Ocado with your ingredients. You can search and add items to your basket.',
      items: items
    });
  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});