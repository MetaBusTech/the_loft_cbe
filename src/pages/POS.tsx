import React, { useState } from 'react';
import { useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Product, ProductCategory, PaymentMethod } from '../types';
import { productsAPI, ordersAPI, paymentsAPI } from '../services/api';

const POS: React.FC = () => {
  const {
    items,
    subtotal,
    taxAmount,
    totalAmount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  } = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, productsResponse] = await Promise.all([
        productsAPI.getCategories(),
        productsAPI.getAll({ isActive: true })
      ]);
      
      const allCategories = [
        { id: 'all', name: 'All Items', description: '', isActive: true },
        ...categoriesResponse.data
      ];
      
      setCategories(allCategories);
      setProducts(productsResponse.data.products);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePayment = () => {
    if (items.length === 0) return;
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (processing) return;
    
    try {
      setProcessing(true);
      
      // Create order
      const orderData = {
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes
        })),
        discountAmount: discountAmount,
        notes: ''
      };
      
      const orderResponse = await ordersAPI.create(orderData);
      const order = orderResponse.data;
      
      // Process payment
      await paymentsAPI.processManualPayment(order.id, selectedPaymentMethod);
      
      // Print receipt if needed
      try {
        await ordersAPI.print(order.id);
      } catch (printError) {
        console.warn('Failed to print receipt:', printError);
      }
      
      alert(`Payment of ₹${totalAmount.toFixed(2)} processed successfully!`);
      
      // Clear cart and reset form
    clearCart();
    setCustomerName('');
    setCustomerPhone('');
    setShowPaymentModal(false);
    } catch (error: any) {
      console.error('Payment processing failed:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Products Section */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Point of Sale</h1>
          
          {/* Search and Categories */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => addItem(product)}
            >
              <img
                src={product.image}
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-3">
                <h3 className="font-medium text-gray-800 text-sm mb-1">{product.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{product.description}</p>
                <p className="text-lg font-bold text-orange-500">₹{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
        
        {/* Customer Info */}
        <div className="mb-4 space-y-3">
          <input
            type="text"
            placeholder="Customer Name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <input
            type="tel"
            placeholder="Phone Number (optional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No items in cart</p>
              <p className="text-sm">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800 text-sm">{item.product.name}</h4>
                    <button
                      onClick={() => removeItem(item.id!)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id!, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">₹{item.unitPrice} each</p>
                      <p className="font-bold text-gray-800">₹{item.totalPrice}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Total */}
        {items.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (18%):</span>
                <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={handlePayment}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all font-medium"
              >
                Process Payment
              </button>
              <button
                onClick={clearCart}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Payment Method</h3>
            
            <div className="space-y-3 mb-6">
              {[
                { id: 'cash', label: 'Cash Payment', icon: Banknote },
                { id: 'card', label: 'Card Payment', icon: CreditCard },
                { id: 'upi', label: 'UPI Payment', icon: Smartphone }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id as any)}
                  className={`w-full p-4 border-2 rounded-lg flex items-center space-x-3 transition-colors ${
                    selectedPaymentMethod === method.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <method.icon className="w-5 h-5" />
                  <span className="font-medium">{method.label}</span>
                </button>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={processing}
                disabled={processing}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all font-medium"
                className={`flex-1 py-3 rounded-lg transition-all font-medium ${
                  processing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
                }`}
                className={`w-full py-3 rounded-lg transition-all font-medium ${
                  processing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
                }`}
              >
                {processing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;