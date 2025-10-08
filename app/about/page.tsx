"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Clock, 
  Shield, 
  Truck, 
  Star, 
  Users, 
  Award, 
  Phone, 
  Mail, 
  MapPin,
  Heart,
  Coffee,
  Utensils
} from "lucide-react";

export default function About() {
  const [activeTab, setActiveTab] = useState("mission");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🍔</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Campus Canteen
                </span>
              </div>
            </Link>
            
            <div className="hidden lg:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200">
                Home
              </Link>
              <Link href="/menu" className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200">
                Menu
              </Link>
              <Link href="/about" className="text-green-600 font-medium border-b-2 border-green-500">
                About
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="px-6 py-2 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-all duration-200"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            About Campus Canteen
          </h1>
          <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto opacity-90 leading-relaxed">
            Revolutionizing campus dining with delicious food, seamless ordering, 
            and exceptional service for students and staff.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="bg-white bg-opacity-20 px-6 py-3 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold">5000+</div>
              <div className="text-sm opacity-90">Happy Students</div>
            </div>
            <div className="bg-white bg-opacity-20 px-6 py-3 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold">100+</div>
              <div className="text-sm opacity-90">Daily Orders</div>
            </div>
            <div className="bg-white bg-opacity-20 px-6 py-3 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold">4.8★</div>
              <div className="text-sm opacity-90">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Our Mission & Vision
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                At Campus Canteen, we believe that great food should be accessible, 
                affordable, and convenient for every member of our campus community. 
                We're committed to transforming the campus dining experience through 
                technology and quality service.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Student-First Approach</h3>
                    <p className="text-gray-600">Designed specifically for campus life with student needs in mind.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Coffee className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Quality & Freshness</h3>
                    <p className="text-gray-600">Fresh ingredients and delicious recipes prepared daily.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <img
                src="/api/placeholder/600/400"
                alt="Campus Canteen Team"
                className="w-full h-64 object-cover rounded-xl mb-6"
              />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us?</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Fast and reliable service</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Affordable student pricing</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Easy online ordering</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Wide variety of choices</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Makes Us Different
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We've built Campus Canteen with features that matter most to our campus community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Quick Service</h3>
              <p className="text-gray-600 leading-relaxed">
                Order and receive your food in minutes, not hours. Perfect for busy class schedules.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Safe & Secure</h3>
              <p className="text-gray-600 leading-relaxed">
                Your data and payments are protected with enterprise-grade security.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Truck className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Campus Delivery</h3>
              <p className="text-gray-600 leading-relaxed">
                Get your food delivered anywhere on campus - dorms, libraries, or classrooms.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6">
                <Star className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Quality Food</h3>
              <p className="text-gray-600 leading-relaxed">
                Fresh ingredients, hygienic preparation, and delicious recipes every time.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 border border-red-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-6">
                <Users className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Community Focus</h3>
              <p className="text-gray-600 leading-relaxed">
                Built for students, by students. We understand campus life and needs.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                <Award className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Award Winning</h3>
              <p className="text-gray-600 leading-relaxed">
                Recognized as the best campus food service for three consecutive years.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Passionate students and professionals working together to serve our campus community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Head Chef",
                bio: "5+ years of culinary experience, passionate about student nutrition.",
                emoji: "👩‍🍳"
              },
              {
                name: "Mike Rodriguez",
                role: "Operations Manager",
                bio: "Ensures smooth daily operations and customer satisfaction.",
                emoji: "👨‍💼"
              },
              {
                name: "Emily Watson",
                role: "Nutrition Specialist",
                bio: "Creates balanced meals that fuel student success.",
                emoji: "🥗"
              },
              {
                name: "Alex Thompson",
                role: "Tech Lead",
                bio: "Builds the platform that makes ordering seamless.",
                emoji: "💻"
              }
            ].map((member, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                  {member.emoji}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-green-600 font-semibold mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">Visit Us</h3>
                  <p className="text-gray-600">Student Center Building, Room 101<br />Campus Main Road</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">Call Us</h3>
                  <p className="text-gray-600">+1 (555) 123-4567<br />Mon-Fri: 8:00 AM - 8:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">Email Us</h3>
                  <p className="text-gray-600">hello@campuscanteen.edu<br />support@campuscanteen.edu</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Utensils className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold">Campus Canteen</span>
              </div>
              <p className="text-gray-400">
                Serving the campus community with delicious food and exceptional service.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/menu" className="text-gray-400 hover:text-white transition-colors">Menu</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Feedback</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Campus Canteen. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}