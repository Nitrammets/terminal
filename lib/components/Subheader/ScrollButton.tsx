import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollButtonProps {
  direction: "left" | "right";
  onClick: () => void;
}

const ScrollButton = ({ direction, onClick }: ScrollButtonProps) => {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      className={`absolute ${direction}-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 h-full px-2 flex items-center`}
    >
      <Icon className="text-primaryText w-4 h-4" />
    </button>
  );
};

export default ScrollButton;
