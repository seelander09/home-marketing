const properties = [
  {
    id: 1,
    title: 'Modern Family Home',
    price: '$850,000',
    location: 'Downtown District',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2800,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=300&fit=crop',
  },
  {
    id: 2,
    title: 'Luxury Condo',
    price: '$650,000',
    location: 'City Center',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1500,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&h=300&fit=crop',
  },
  {
    id: 3,
    title: 'Cozy Suburban House',
    price: '$425,000',
    location: 'Quiet Neighborhood',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&h=300&fit=crop',
  },
]

export function PropertyGrid() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Featured Properties
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium properties
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src={property.image} 
                alt={property.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {property.title}
                </h3>
                <p className="text-primary-600 font-bold text-lg mb-2">
                  {property.price}
                </p>
                <p className="text-gray-600 mb-4">{property.location}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{property.bedrooms} beds</span>
                  <span>{property.bathrooms} baths</span>
                  <span>{property.sqft.toLocaleString()} sqft</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button className="btn-primary">
            View All Properties
          </button>
        </div>
      </div>
    </section>
  )
}
