import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page py-32 text-center">
      <p className="font-display text-6xl font-semibold gradient-text">404</p>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        We couldn't find that page
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
        The link you followed may be broken, or the page may have moved.
      </p>
      <Link to="/" className="btn-primary mt-8">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
    </div>
  );
}
