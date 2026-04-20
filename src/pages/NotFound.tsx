import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="container text-center">
        <div className="text-8xl md:text-9xl font-bold gradient-text mb-4">
          404
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get
          you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="gradient" size="lg" asChild>
            <Link to="/">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/courses">
              <ArrowLeft className="w-4 h-4" />
              Browse Courses
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
