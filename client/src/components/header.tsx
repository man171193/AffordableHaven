import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-neutral-900">
              <span className="text-primary">Packing</span> Report System
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="hidden md:block text-sm font-medium">{user.name}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => logoutMutation.mutate()} 
                  disabled={logoutMutation.isPending}
                  className="flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {user && (
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
      )}
    </header>
  );
}
