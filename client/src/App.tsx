import { Route, Switch } from "wouter";
import CreateReport from "@/pages/create-report";
import ReportHistory from "@/pages/report-history";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";

function Router() {
  // Seed the database with initial data when the app first loads
  useEffect(() => {
    const seedDatabase = async () => {
      try {
        await apiRequest("POST", "/api/seed", {});
      } catch (error) {
        console.error("Error seeding database:", error);
      }
    };
    
    seedDatabase();
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <ProtectedRoute path="/" component={CreateReport} />
            <ProtectedRoute path="/history" component={ReportHistory} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
        <Toaster />
      </div>
    </AuthProvider>
  );
}

function App() {
  return <Router />;
}

export default App;
