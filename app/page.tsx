import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to <span className="text-green-600">Campus Canteen</span> 🍕
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover delicious meals, order with ease, and enjoy campus dining like never before. 
          Browse our menu, place orders, and track your food in real-time.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="text-3xl mb-4">🍔</div>
            <h3 className="text-lg font-semibold mb-2">Wide Menu Selection</h3>
            <p className="text-gray-600">Choose from a variety of delicious meals and snacks</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Quick Ordering</h3>
            <p className="text-gray-600">Order your food in seconds with our streamlined process</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-lg font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-gray-600">Track your order status from preparation to delivery</p>
          </div>
        </div>

        <div className="space-x-4">
          <Link 
            href="/signup" 
            className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors duration-200"
          >
            Get Started
          </Link>
          <Link 
            href="/login" 
            className="bg-white text-green-600 border border-green-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}