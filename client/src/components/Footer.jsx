import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault(); // Prevent form from reloading the page
    try {
      const response = await fetch('/user/subscribeToNewsLetter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Subscribed successfully!");
        setEmail(''); // Clear input after success
      } else {
        toast.error(result.message || "Subscription failed!");
      }
    } catch (error) {
      toast.error("Error subscribing. Please try again later.");
      console.error('Error:', error);
    }
  };

  return (
    <footer className="footer backdrop-blur-md bg-gradient-to-r from-blue-500 to-purple-500 border-t border-white/20 text-gray-300 p-10 shadow-lg">
      {/* Toast Container */}
      <Toaster position="top-right" reverseOrder={false} />

      <nav>
        <h6 className="footer-title text-lg font-semibold mb-2 text-white">Services</h6>
        <a className="link link-hover hover:text-gray-300 transition-colors duration-300">Branding</a>
        <a className="link link-hover hover:text-gray-300 transition-colors duration-300">Design</a>
        <a className="link link-hover hover:text-gray-300 transition-colors duration-300">Marketing</a>
        <a className="link link-hover hover:text-gray-300 transition-colors duration-300">Advertisement</a>
      </nav>
      <nav>
        <h6 className="footer-title text-lg font-semibold mb-2 text-white">Company</h6>
        <a className="link link-hover hover:text-gray-300 transition-colors duration-300">About us</a>
        <a className="link link-hover hover:text-gray-300 transition-colors duration-300">Contact</a>
        <a className="link link-hover hover:text-gray-300 transition-colors duration-300">Jobs</a>
        <a className="link link-hover hover:text-gray-300 transition-colors duration-300">Press kit</a>
      </nav>
      <nav>
        <h6 className="footer-title text-lg font-semibold mb-2 text-white">Legal</h6>
        <a className="link link-hover hover:text-gray-300 transition-colors duration-300">Terms of use</a>
        <a className="link link-hover hover:text-gray-300 transition-colors duration-300">Privacy policy</a>
        <a className="link link-hover hover:text-gray-300 transition-colors duration-300">Cookie policy</a>
      </nav>
      <form onSubmit={handleSubscribe}>
        <h6 className="footer-title text-lg font-semibold mb-2 text-white">Newsletter</h6>
        <fieldset className="form-control w-80">
          <label className="label">
            <span className="label-text text-white">Enter your email address</span>
          </label>
          <div className="join flex gap-2">
            <input
              type="email"
              placeholder="username@site.com"
              className="input input-bordered join-item bg-white/80 text-black px-4 py-2 rounded-l-lg focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn bg-white/80 text-blue-500 font-semibold px-6 py-2 rounded-r-lg shadow-md hover:bg-blue-500 hover:text-white transition duration-300 ease-in-out"
            >
              Subscribe
            </button>
          </div>
        </fieldset>
      </form>
    </footer>
  );
};
