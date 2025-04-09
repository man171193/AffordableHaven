import { useLocation, Link } from "wouter";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-neutral-900">
              <span className="text-primary">Packing</span> Report System
            </h1>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link href="/" className={`${location === "/" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
            Create New Report
          </Link>
          <Link href="/history" className={`${location === "/history" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
            Report History
          </Link>
        </nav>
      </div>
    </header>
  );
}
