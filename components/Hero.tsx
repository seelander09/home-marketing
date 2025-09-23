'use client'

import { motion } from 'framer-motion'

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
      <div className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Find Your Dream Home
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100">
            Discover beautiful properties and make your real estate dreams come true
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
              Browse Properties
            </button>
            <button className="btn-secondary bg-primary-500 hover:bg-primary-400 text-white">
              List Your Property
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
