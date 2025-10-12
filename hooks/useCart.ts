// hooks/useCart.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  status: "available" | "unavailable";
}

interface CartItem {
  item: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
    status: "available" | "unavailable";
  };
  quantity: number;
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const processingItems = useRef<Set<string>>(new Set());

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('canteenCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        const cartMap = new Map();
        parsedCart.forEach(cartItem => {
          if (cartItem?.item?._id && cartItem.quantity > 0) {
            cartMap.set(cartItem.item._id, cartItem);
          }
        });
        setCart(Array.from(cartMap.values()));
      } catch (error) {
        localStorage.removeItem('canteenCart');
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('canteenCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((item: MenuItem) => {
    const itemId = item._id;
    
    // Immediate duplicate check
    if (processingItems.current.has(itemId)) {
      console.log('🛑 addToCart blocked: operation already in progress for', itemId);
      return;
    }

    // Mark this item as being processed
    processingItems.current.add(itemId);

    if (item.status !== "available") {
      toast.error("This item is currently unavailable");
      processingItems.current.delete(itemId);
      return;
    }

    console.log('✅ Starting addToCart for:', item.name);

    setCart(prevCart => {
      const cartMap = new Map();
      prevCart.forEach(cartItem => cartMap.set(cartItem.item._id, cartItem));

      if (cartMap.has(itemId)) {
        const existing = cartMap.get(itemId)!;
        const oldQuantity = existing.quantity;
        const newQuantity = Math.min(oldQuantity + 1, 10);
        
        if (newQuantity === oldQuantity) {
          toast.error(`Maximum quantity (10) reached for ${item.name}`);
          return prevCart;
        }

        cartMap.set(itemId, { ...existing, quantity: newQuantity });
        
        // Show different messages based on context
        if (oldQuantity === 1) {
          toast.success(`Increased ${item.name} quantity to ${newQuantity}`);
        } else {
          toast.success(`Updated ${item.name} quantity to ${newQuantity}`);
        }
      } else {
        cartMap.set(itemId, { 
          item: {
            _id: item._id,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl,
            status: item.status
          }, 
          quantity: 1 
        });
        toast.success(`Added ${item.name} to cart! 🎉`);
      }

      return Array.from(cartMap.values());
    });

    // Clean up after operation is complete
    setTimeout(() => {
      processingItems.current.delete(itemId);
    }, 100);
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.item._id !== itemId));
    toast.success("Item removed from cart");
  }, []);

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    if (newQuantity > 10) {
      toast.error("Maximum quantity per item is 10");
      return;
    }
    setCart(prev => prev.map(item => 
      item.item._id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    toast.success("Cart cleared successfully");
  }, []);

  const getTotalPrice = useCallback(() => 
    cart.reduce((total, item) => total + (item.item.price * item.quantity), 0), 
    [cart]
  );

  const getTotalItems = useCallback(() => 
    cart.reduce((total, item) => total + item.quantity, 0), 
    [cart]
  );

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems
  };
};