"use client";

import { useState, useEffect } from "react";

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const res = await fetch("/api/items/all");
    const data = await res.json();
    setItems(data);
  }

  function addToCart(item: any) {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === item._id);
      if (existing) {
        return prev.map(i =>
          i.itemId === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prev, { itemId: item._id, name: item.name, price: item.price, quantity: 1 }];
      }
    });
  }

  async function handleOrder() {
    if (cart.length === 0) return alert("Cart is empty");
    setLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error placing order");
      alert("Order placed successfully!");
      setCart([]);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Menu</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item._id} className="border rounded-lg p-3 shadow">
            <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover rounded" />
            <h2 className="text-lg font-semibold">{item.name}</h2>
            <p className="text-gray-600">₹{item.price}</p>
            <button
              onClick={() => addToCart(item)}
              className="bg-green-500 text-white px-3 py-1 rounded mt-2 hover:bg-green-600"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="mt-6 p-4 border-t">
          <h2 className="text-xl font-bold">Your Cart</h2>
          {cart.map(i => (
            <div key={i.itemId} className="flex justify-between mt-2">
              <span>{i.name} x {i.quantity}</span>
              <span>₹{i.price * i.quantity}</span>
            </div>
          ))}
          <button
            onClick={handleOrder}
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Placing..." : "Place Order"}
          </button>
        </div>
      )}
    </div>
  );
}
