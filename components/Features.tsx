const features = [
  {
    title: 'Property Listings',
    description: 'Browse through thousands of carefully curated property listings',
    icon: '🏠',
  },
  {
    title: 'Virtual Tours',
    description: 'Experience properties from anywhere with our virtual tour technology',
    icon: '📱',
  },
  {
    title: 'Expert Agents',
    description: 'Connect with experienced real estate professionals',
    icon: '👥',
  },
  {
    title: 'Market Analysis',
    description: 'Get detailed market insights and property valuations',
    icon: '📊',
  },
]

export function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose Us?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We provide comprehensive real estate services to help you find or sell your perfect home
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
