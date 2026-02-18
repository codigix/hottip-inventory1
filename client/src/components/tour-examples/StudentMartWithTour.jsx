import React, { useState } from 'react';
import { useTour } from '@/hooks/useTour';
import { studentMartTourConfig } from '../tours/studentMartTour';
import StartTourButton from '../StartTourButton';

/**
 * Example Student Mart Component with Tour Integration
 */
const StudentMartWithTour = () => {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const products = [
    { id: 1, name: 'College T-Shirt', price: '$12.99', category: 'clothing', image: '👕' },
    { id: 2, name: 'Campus Hoodie', price: '$29.99', category: 'clothing', image: '🧥' },
    { id: 3, name: 'Notebook Pack', price: '$5.99', category: 'stationery', image: '📓' },
    { id: 4, name: 'Water Bottle', price: '$14.99', category: 'accessories', image: '🍾' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Tour Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Student Mart</h1>
        <StartTourButton
          tourConfig={studentMartTourConfig}
          tourName="studentmartTourDone"
        />
      </div>

      {/* Main Mart Container */}
      <div data-tour="studentmart-main" className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Search Bar */}
          <div data-tour="studentmart-search" className="flex gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categories Sidebar */}
            <div data-tour="studentmart-categories" className="lg:col-span-1">
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                {['all', 'clothing', 'stationery', 'accessories'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-2 rounded transition ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div data-tour="studentmart-products" className="lg:col-span-2">
              <h3 className="font-semibold mb-4">Available Products</h3>
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                    <div className="text-4xl mb-2">{product.image}</div>
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-lg font-bold text-blue-600 mt-2">{product.price}</p>
                    <button
                      onClick={() => setCart([...cart, product])}
                      className="w-full mt-3 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Shopping Cart */}
            <div data-tour="studentmart-cart" className="lg:col-span-1">
              <h3 className="font-semibold mb-4">Shopping Cart</h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-sm">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="font-medium">{item.price}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 mb-4">
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>${(cart.length * 10).toFixed(2)}</span>
                      </div>
                    </div>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                      Proceed to Checkout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMartWithTour;
