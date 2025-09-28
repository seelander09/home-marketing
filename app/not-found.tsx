export default function NotFound() {
  return (
    <section className="section bg-white">
      <div className="container text-center">
        <h1 className="text-4xl font-semibold text-brand-navy">Page not found</h1>
        <p className="mt-4 text-brand-navy/70">We could not find the page you were looking for. Head back to the homepage to continue exploring SmartLead.</p>
        <a href="/" className="btn btn-primary mt-6 inline-flex">Return home</a>
      </div>
    </section>
  )
}
