import { Button } from "@/components/ui/button";
import { HelpCircle, RotateCcw } from "lucide-react";
import { useTourStatus } from "@/contexts/TourContext";
import { useTour } from "@/hooks/useTour";

export function StartTourButton({ tourConfig, tourName, className = "", navigationHandler = null }) {
  const { getTourStatus, resetTourStatus } = useTourStatus();
  const { startTour } = useTour();

  const isCompleted = getTourStatus(tourName);

  const handleClick = () => {
    resetTourStatus(tourName);
    startTour(tourConfig, navigationHandler);
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className={`gap-2 ${className}`}
      title={isCompleted ? "Retake the guided tour" : "Start the guided tour"}
    >
      {isCompleted ? (
        <>
          <RotateCcw className="w-4 h-4" />
          Retake Tour
        </>
      ) : (
        <>
          <HelpCircle className="w-4 h-4" />
          Start Tour
        </>
      )}
    </Button>
  );
}
