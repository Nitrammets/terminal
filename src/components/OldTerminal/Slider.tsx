import { forwardRef } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "../../lib/utils";

const Slider = forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-gray-200 dark:bg-[#474d57]">
      <SliderPrimitive.Range className="absolute h-full bg-accent" />
      {children}
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      style={{ zoom: 1.5 }}
      className="block cursor-pointer h-3 w-3 z-10 border-2 rounded-sm rotate-45 border-accent bg-white dark:bg-[#1e2329] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
