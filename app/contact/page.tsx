"use client";
import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Mobile Header with Burger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="flex justify-between items-center p-4">
          <Link href="/" className="text-lg font-bold text-green-600">
            Campus Canteen
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200">
            <div className="flex flex-col p-4 space-y-3">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-green-600 font-medium py-2 transition-colors duration-200 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                🏠 Home
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-green-600 font-medium py-2 transition-colors duration-200 text-center border-b border-gray-200 pb-3"
                onClick={() => setIsMenuOpen(false)}
              >
                📞 Contact
              </Link>
              <Link 
                href="/login" 
                className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="bg-white text-green-600 border border-green-600 px-4 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-200 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="pt-16 lg:pt-0 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 lg:mb-16">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <span className="text-2xl text-white">🍔</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Contact Us
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Get in touch with Campus Canteen. We're here to help with any questions about our services, 
              menu, or catering options.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6 lg:space-y-8">
              {/* Contact Card */}
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Get in Touch</h2>
                
                {/* Email Contact */}
                <div className="mb-6 lg:mb-8">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4 flex items-center">
                    <span className="w-7 h-7 lg:w-8 lg:h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 lg:mr-3">
                      📧
                    </span>
                    Email Us
                  </h3>
                  <div className="space-y-2 lg:space-y-3">
                    <div>
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">General Inquiries</p>
                      <a 
                        href="mailto:info@campuscanteen.com" 
                        className="text-green-600 hover:text-green-700 font-medium transition-colors duration-200 text-sm lg:text-base"
                      >
                        info@campuscanteen.com
                      </a>
                    </div>
                    <div>
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Support</p>
                      <a 
                        href="mailto:support@campuscanteen.com" 
                        className="text-green-600 hover:text-green-700 font-medium transition-colors duration-200 text-sm lg:text-base"
                      >
                        support@campuscanteen.com
                      </a>
                    </div>
                    <div>
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Catering</p>
                      <a 
                        href="mailto:catering@campuscanteen.com" 
                        className="text-green-600 hover:text-green-700 font-medium transition-colors duration-200 text-sm lg:text-base"
                      >
                        catering@campuscanteen.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Phone Contact */}
                <div className="mb-6 lg:mb-8">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4 flex items-center">
                    <span className="w-7 h-7 lg:w-8 lg:h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 lg:mr-3">
                      📞
                    </span>
                    Call Us
                  </h3>
                  <div className="space-y-2 lg:space-y-3">
                    <div>
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Main Office</p>
                      <a 
                        href="tel:+1-555-123-4567" 
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 text-sm lg:text-base"
                      >
                        +1 (555) 123-4567
                      </a>
                    </div>
                    <div>
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Emergency</p>
                      <a 
                        href="tel:+1-555-987-6543" 
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 text-sm lg:text-base"
                      >
                        +1 (555) 987-6543
                      </a>
                    </div>
                    <div>
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">Catering Hotline</p>
                      <a 
                        href="tel:+1-555-246-8135" 
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 text-sm lg:text-base"
                      >
                        +1 (555) 246-8135
                      </a>
                    </div>
                  </div>
                </div>

                {/* Visit Us */}
                <div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4 flex items-center">
                    <span className="w-7 h-7 lg:w-8 lg:h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2 lg:mr-3">
                      📍
                    </span>
                    Visit Us
                  </h3>
                  <div className="space-y-1 lg:space-y-2">
                    <p className="text-gray-700 text-sm lg:text-base">
                      Campus Canteen Main Building
                    </p>
                    <p className="text-gray-600 text-xs lg:text-sm">
                      123 University Avenue<br />
                      Campus City, CC 12345<br />
                      United States
                    </p>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
                <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Operating Hours</h3>
                <div className="space-y-2 lg:space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="font-medium text-gray-800">7:00 AM - 10:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="font-medium text-gray-800">8:00 AM - 9:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="font-medium text-gray-800">9:00 AM - 8:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Send us a Message</h2>
                
                {submitStatus === "success" && (
                  <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 flex items-center text-sm lg:text-base">
                      <span className="mr-2">✅</span>
                      Thank you for your message! We'll get back to you within 24 hours.
                    </p>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 flex items-center text-sm lg:text-base">
                      <span className="mr-2">❌</span>
                      There was an error sending your message. Please try again or contact us directly.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 text-sm lg:text-base"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 text-sm lg:text-base"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 text-sm lg:text-base"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="feedback">Feedback & Suggestions</option>
                      <option value="catering">Catering Services</option>
                      <option value="complaint">Complaint</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 resize-none text-sm lg:text-base"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm lg:text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <span>📤</span>
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Actions */}
                <div className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-gray-200">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                    <a
                      href="mailto:info@campuscanteen.com"
                      className="flex items-center justify-center p-3 lg:p-4 border border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
                    >
                      <span className="text-gray-700 group-hover:text-green-600 font-medium text-sm lg:text-base">
                        📧 Quick Email
                      </span>
                    </a>
                    <a
                      href="tel:+1-555-123-4567"
                      className="flex items-center justify-center p-3 lg:p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                    >
                      <span className="text-gray-700 group-hover:text-blue-600 font-medium text-sm lg:text-base">
                        📞 Call Now
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-8 lg:mt-16 bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6 lg:mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm lg:text-base">What are your operating hours?</h3>
                  <p className="text-gray-600 text-xs lg:text-sm">
                    We're open Monday-Friday from 7:00 AM to 10:00 PM, Saturday from 8:00 AM to 9:00 PM, 
                    and Sunday from 9:00 AM to 8:00 PM.
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm lg:text-base">Do you offer catering services?</h3>
                  <p className="text-gray-600 text-xs lg:text-sm">
                    Yes! We provide catering for campus events, meetings, and special occasions. 
                    Contact our catering team for customized menus.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm lg:text-base">How can I provide feedback?</h3>
                  <p className="text-gray-600 text-xs lg:text-sm">
                    We value your feedback! Use the contact form above, email us directly, 
                    or speak with our manager during your visit.
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm lg:text-base">Do you have emergency contacts?</h3>
                  <p className="text-gray-600 text-xs lg:text-sm">
                    For urgent matters outside business hours, call our emergency line at +1 (555) 987-6543.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}