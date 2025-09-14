import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to admin dashboard by default
    setLocation("/admin");
  }, [setLocation]);

  return null;
}
