import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function OnboardingRedirect({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        const hasCompletedOnboarding = localStorage.getItem("onboarding_completed");
        
        // If user is new (no business_name yet) and not in onboarding flow
        if (!user.business_name && !hasCompletedOnboarding && 
            location.pathname !== "/onboarding" && 
            !location.pathname.startsWith("/pricing") &&
            !location.pathname.startsWith("/checkout")) {
          navigate("/onboarding", { replace: true });
        }
      } catch (e) {
        // Silent error - user might not be authenticated
      }
    };

    checkOnboarding();
  }, [location.pathname, navigate]);

  return children;
}