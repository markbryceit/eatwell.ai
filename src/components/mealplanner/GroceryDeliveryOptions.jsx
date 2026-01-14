import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, DollarSign, Truck, Mail, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const groceryServices = [
  { 
    id: 'ocado', 
    name: 'Ocado', 
    logo: '🎯',
    color: 'bg-purple-600',
    url: 'https://www.ocado.com/',
    hasAPI: true
  },
  { 
    id: 'tesco', 
    name: 'Tesco', 
    logo: '🛒',
    color: 'bg-blue-600',
    url: 'https://www.tesco.com/groceries/'
  },
  { 
    id: 'sainsburys', 
    name: 'Sainsbury\'s', 
    logo: '🍊',
    color: 'bg-orange-500',
    url: 'https://www.sainsburys.co.uk/shop/gb/groceries'
  },
  { 
    id: 'asda', 
    name: 'Asda', 
    logo: '💚',
    color: 'bg-green-600',
    url: 'https://groceries.asda.com/'
  },
  { 
    id: 'morrisons', 
    name: 'Morrisons', 
    logo: '🌟',
    color: 'bg-yellow-500',
    url: 'https://groceries.morrisons.com/'
  },
  { 
    id: 'waitrose', 
    name: 'Waitrose', 
    logo: '👑',
    color: 'bg-emerald-700',
    url: 'https://www.waitrose.com/'
  }
];

export default function GroceryDeliveryOptions({ shoppingList, onClose }) {
  const [isEstimating, setIsEstimating] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [isAddingToOcado, setIsAddingToOcado] = useState(false);

  const formatShoppingListText = () => {
    let text = '🛒 Shopping List\n\n';
    Object.entries(shoppingList).forEach(([category, items]) => {
      text += `${category}:\n`;
      items.forEach(item => {
        text += `  • ${item.name}${item.count > 1 ? ` (${item.count})` : ''}\n`;
      });
      text += '\n';
    });
    return text;
  };

  const handleCopyList = () => {
    const text = formatShoppingListText();
    navigator.clipboard.writeText(text);
    toast.success('Shopping list copied to clipboard!');
  };

  const handleEmailList = () => {
    const text = formatShoppingListText();
    const subject = encodeURIComponent('My Shopping List');
    const body = encodeURIComponent(text);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleAddToOcado = async () => {
    setIsAddingToOcado(true);
    try {
      const items = Object.values(shoppingList).flat();
      const { data } = await base44.functions.invoke('addToOcadoBasket', {
        items: items.map(item => ({
          name: item.name,
          quantity: item.count
        }))
      });
      
      if (data.success && data.basketUrl) {
        toast.success('Items added to Ocado basket!');
        window.open(data.basketUrl, '_blank');
      } else {
        toast.error('Please authorize Ocado to add items automatically');
      }
    } catch (error) {
      toast.error('Failed to add to Ocado. Opening website instead...');
      handleOpenService(groceryServices.find(s => s.id === 'ocado'));
    }
    setIsAddingToOcado(false);
  };

  const handleOpenService = (service) => {
    if (service.id === 'ocado' && service.hasAPI) {
      handleAddToOcado();
      return;
    }
    
    toast.info(`Opening ${service.name}...`);
    window.open(service.url, '_blank');
    
    // Copy list to clipboard for easy pasting
    const text = formatShoppingListText();
    navigator.clipboard.writeText(text);
    toast.success('List copied! Paste it in the grocery site search.');
  };

  const handleEstimatePrice = async () => {
    setIsEstimating(true);
    try {
      const items = Object.values(shoppingList).flat();
      const { data } = await base44.functions.invoke('estimateGroceryCost', {
        items: items.map(item => ({
          name: item.name,
          quantity: item.count
        }))
      });
      
      setPriceEstimate(data);
      toast.success('Price estimate generated!');
    } catch (error) {
      toast.error('Could not estimate prices. Try again later.');
    }
    setIsEstimating(false);
  };

  const totalItems = Object.values(shoppingList).reduce((sum, items) => sum + items.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Grocery Delivery</h3>
        <p className="text-slate-500">
          {totalItems} items ready to order
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={handleCopyList}
          className="h-auto py-4 flex flex-col gap-2"
        >
          <Copy className="w-5 h-5" />
          <span className="text-sm">Copy List</span>
        </Button>
        <Button
          variant="outline"
          onClick={handleEmailList}
          className="h-auto py-4 flex flex-col gap-2"
        >
          <Mail className="w-5 h-5" />
          <span className="text-sm">Email List</span>
        </Button>
      </div>

      {/* Price Estimate */}
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
        <CardContent className="p-4">
          {priceEstimate ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Estimated Total</span>
                <span className="text-2xl font-bold text-violet-700">
                  ${priceEstimate.estimated_total.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Price Range</span>
                <span className="text-slate-700">
                  ${priceEstimate.min_total.toFixed(2)} - ${priceEstimate.max_total.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Prices may vary by store and location. This is an estimate based on typical grocery costs.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleEstimatePrice}
              disabled={isEstimating}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {isEstimating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Estimating...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Estimate Cost
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Grocery Services */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          UK Supermarkets - Order Online
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {groceryServices.map((service) => (
            <button
              key={service.id}
              onClick={() => handleOpenService(service)}
              disabled={service.id === 'ocado' && isAddingToOcado}
              className={`p-4 rounded-xl border-2 transition-all group relative ${
                service.hasAPI 
                  ? 'border-purple-300 bg-purple-50 hover:border-purple-500 hover:bg-purple-100'
                  : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50'
              }`}
            >
              {service.hasAPI && (
                <Badge className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs">
                  Auto-Add
                </Badge>
              )}
              <div className="text-3xl mb-2">{service.logo}</div>
              <div className={`font-medium text-sm ${
                service.hasAPI ? 'text-purple-700 group-hover:text-purple-800' : 'text-slate-900 group-hover:text-emerald-700'
              }`}>
                {service.name}
              </div>
              {service.id === 'ocado' && isAddingToOcado ? (
                <Loader2 className="w-3 h-3 mx-auto mt-1 animate-spin text-purple-500" />
              ) : (
                <ExternalLink className={`w-3 h-3 mx-auto mt-1 ${
                  service.hasAPI ? 'text-purple-400 group-hover:text-purple-600' : 'text-slate-400 group-hover:text-emerald-500'
                }`} />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">
          <span className="text-purple-600 font-semibold">Ocado:</span> Items automatically added to your basket. 
          <span className="text-slate-500 ml-1">Other stores: list copied to clipboard for easy searching.</span>
        </p>
      </div>

      {/* How It Works */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h5 className="font-semibold text-blue-900 mb-2 text-sm">How it works:</h5>
          <ol className="text-xs text-blue-800 space-y-1">
            <li>1. Click on your preferred grocery service</li>
            <li>2. Your list is automatically copied</li>
            <li>3. Paste it in the store's search bar</li>
            <li>4. Add items to cart and checkout</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}