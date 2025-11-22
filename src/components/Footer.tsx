import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, Mail, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-brand-blue/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <PhoneCall className="h-5 w-5 text-brand-red mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium">Mrs. Sarika Reddy</p>
                  <p className="text-sm">+91 9868220018</p>
                  <p className="text-sm font-medium mt-2">S. Chandrasheker Reddy</p>
                  <p className="text-sm">+91 9701039748</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-brand-red mt-0.5 mr-2" />
                <p className="text-sm">scragro79@gmail.com</p>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-brand-red mt-0.5 mr-2" />
                <p className="text-sm">SCR Agrofarms, NH-40, Gyrampalli, Annamaya Dist, AP-517213</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {/* <li>
                <Link to="/" className="text-sm hover:text-brand-red transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/products" className="text-sm hover:text-brand-red transition-colors">Our Products</Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-brand-red transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/bilona-method" className="text-sm hover:text-brand-red transition-colors">The Bilona Method</Link>
              </li> */}
              <li>
                <Link to="/privacy-policy" className="text-sm hover:text-brand-red transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm hover:text-brand-red transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="text-sm hover:text-brand-red transition-colors">Shipping Policy</Link>
              </li>
              <li>
                <Link to="/cancellations" className="text-sm hover:text-brand-red transition-colors">Cancellations & Refunds</Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-brand-red transition-colors">Contact Us</Link>
              </li>
              {/* <li>
                <Link to="/home-delivery" className="text-sm hover:text-brand-red transition-colors">Home Delivery</Link>
              </li> */}
            </ul>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold">Operating Hours</h3>
            <div className="space-y-2">
              <p className="text-sm">Mon - Sat: 8am - 8pm</p>
              <p className="text-sm">Sunday: 9am - 6pm</p>
              {/* <p className="text-sm mt-4">Orders placed before 4pm will be delivered next day.</p> */}
            </div>
            <div className="pt-2">
              <h4 className="text-md font-semibold">Connect With Us</h4>
              <div className="flex space-x-4 mt-2">
                <a href="#" className="text-gray-600 hover:text-brand-red transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-brand-red transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-brand-red transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold">Find Us</h3>
            <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200">
              <a href="https://photos.app.goo.gl/HTgcZq32qB4sE9rM6" target="_blank" rel="noopener noreferrer">
                <div className="aspect-w-4 aspect-h-3 bg-gray-100 flex items-center justify-center">
                  <div className="p-4 text-center">
                    <MapPin className="h-6 w-6 mx-auto text-brand-red mb-2" />
                    <p className="text-sm">View Location on Google Maps</p>
                  </div>
                </div>
              </a>
            </div>
            <p className="text-sm">Click the map to navigate to our location on Google Maps</p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SCR Agro Farms. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
