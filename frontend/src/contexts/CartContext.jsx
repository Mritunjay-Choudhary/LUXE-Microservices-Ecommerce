import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], totalItems: 0, subtotal: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], totalItems: 0, subtotal: 0 });
      return;
    }
    setLoading(true);
    try {
      const data = await cartApi.get();
      setCart(data.cart || data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (productId, quantity = 1) => {
    try {
      const data = await cartApi.addItem(productId, quantity);
      setCart(data.cart || data);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add item');
      throw err;
    }
  };

  const updateItem = async (productId, quantity) => {
    try {
      const data = await cartApi.updateItem(productId, quantity);
      setCart(data.cart || data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update item');
      throw err;
    }
  };

  const removeItem = async (productId) => {
    try {
      const data = await cartApi.removeItem(productId);
      setCart(data.cart || data);
      toast.success('Removed from cart');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to remove item');
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clear();
      setCart({ items: [], totalItems: 0, subtotal: 0 });
    } catch {
      // silent
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems: cart?.items || [],
        totalItems: cart?.totalItems || 0,
        loading,
        addItem,
        updateItem,
        updateQuantity: updateItem,
        removeItem,
        clearCart,
        fetchCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
