import { Route, Switch } from "wouter";
import CreateReport from "@/pages/create-report";
import ReportHistory from "@/pages/report-history";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";

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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Switch>
            <Route path="/" component={CreateReport} />
            <Route path="/history" component={ReportHistory} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return <Router />;
}

export default App;
