import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedButtonProps extends ButtonProps {
  pulseOnHover?: boolean;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, pulseOnHover = true, children, ...props }, ref) => {
    return (
      <motion.div
        whileHover={pulseOnHover ? { scale: 1.02 } : undefined}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Button
          ref={ref}
          className={cn(
            "relative overflow-hidden transition-all duration-300",
            className
          )}
          {...props}
        >
          <span className="relative z-10">{children}</span>
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 pointer-events-none"
            initial={{ opacity: 0, x: "100%" }}
            whileHover={{ opacity: 0.5, x: "-100%" }}
            transition={{ duration: 0.5 }}
          />
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };