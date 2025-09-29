import React, { createContext, useContext, useState, useReducer } from 'react';
import { OrderItem, Product } from '../types';

interface CartState {
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  discountAmount: number;
}

interface CartContextType extends CartState {
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  applyDiscount: (amount: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_DISCOUNT'; payload: { amount: number } };

const TAX_RATE = 0.18; // 18% GST

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.product.id === product.id);
      
      let newItems: OrderItem[];
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + quantity, totalPrice: (item.quantity + quantity) * item.unitPrice }
            : item
        );
      } else {
        const newItem: OrderItem = {
          id: `item_${Date.now()}`,
          product,
          quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity
        };
        newItems = [...state.items, newItem];
      }
      
      const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = subtotal * TAX_RATE;
      const totalAmount = subtotal + taxAmount - state.discountAmount;
      
      return {
        ...state,
        items: newItems,
        subtotal,
        taxAmount,
        totalAmount
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      const newItems = state.items.map(item => 
        item.id === itemId 
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      ).filter(item => item.quantity > 0);
      
      const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = subtotal * TAX_RATE;
      const totalAmount = subtotal + taxAmount - state.discountAmount;
      
      return {
        ...state,
        items: newItems,
        subtotal,
        taxAmount,
        totalAmount
      };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload.itemId);
      const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = subtotal * TAX_RATE;
      const totalAmount = subtotal + taxAmount - state.discountAmount;
      
      return {
        ...state,
        items: newItems,
        subtotal,
        taxAmount,
        totalAmount
      };
    }
    
    case 'CLEAR_CART':
      return {
        items: [],
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        discountAmount: 0
      };
    
    case 'APPLY_DISCOUNT': {
      const discountAmount = action.payload.amount;
      const totalAmount = state.subtotal + state.taxAmount - discountAmount;
      
      return {
        ...state,
        discountAmount,
        totalAmount
      };
    }
    
    default:
      return state;
  }
};

const initialState: CartState = {
  items: [],
  subtotal: 0,
  taxAmount: 0,
  totalAmount: 0,
  discountAmount: 0
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const applyDiscount = (amount: number) => {
    dispatch({ type: 'APPLY_DISCOUNT', payload: { amount } });
  };

  return (
    <CartContext.Provider value={{
      ...state,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      applyDiscount
    }}>
      {children}
    </CartContext.Provider>
  );
};