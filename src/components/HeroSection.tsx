import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <div className="relative min-h-screen flex items-center">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://photos.google.com/share/AF1QipNt6J8_YPQrAIW68DLkIijFAxVevUyNm3joPjrQmwkkJ8kaSA6omb3FtgDw4DOAIw/photo/AF1QipOkt33H_MV4YZ76cu2pRbGV-LiB3uyX3ZuuAOqy?key=WVRTTkdGb3ZKX1VKUDNVR2w3VE9XSVI0WTZlb3dR')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundBlendMode: 'overlay',
          opacity: 1
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-brand-blue/50 via-white/60 to-white" />
      
      {/* Content */}
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 hero-gradient-text">
              SCR Agro Farms
            </h1>
            <p className="text-xl md:text-2xl font-display text-gray-700 mb-2 italic">
              Rich in Taste, Packed with Love
            </p>
            <p className="text-lg md:text-xl font-medium mb-8">
              Farm-Fresh, Home Made with Bilona Method
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/products">
                <Button size="lg" className="bg-brand-red hover:bg-brand-red/90 text-white">
                  Explore Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/bilona-method">
              <Button size="lg" variant="outline" className="border-brand-red text-brand-red hover:bg-brand-red/10">
                Learn About Bilona Method
              </Button>
              </Link>
            </div>
          </motion.div>
          
          {/* Featured badges */}
          <motion.div 
            className="mt-16 flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="glass-panel px-4 py-2">
              <span className="text-sm font-semibold">100% Organic</span>
            </div>
            <div className="glass-panel px-4 py-2">
              <span className="text-sm font-semibold">A2 Sahiwal Cow</span>
            </div>
            <div className="glass-panel px-4 py-2">
              <span className="text-sm font-semibold">Natural Fermentation</span>
            </div>
            <div className="glass-panel px-4 py-2">
              <span className="text-sm font-semibold">Premium Packaging</span>
            </div>
            <div className="glass-panel px-4 py-2">
              <span className="text-sm font-semibold">Home Delivery</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
