import React from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  animateOnHover?: boolean;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, animateOnHover = true, children, ...props }, ref) => {
    return (
      <div ref={ref} {...props} className={className}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={
            animateOnHover
              ? {
                  y: -5,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }
              : undefined
          }
        >
          <Card className="border-2 h-full transition-all duration-300">
            {children}
          </Card>
        </motion.div>
      </div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

// Re-export with the Animated prefix
const AnimatedCardHeader = CardHeader;
const AnimatedCardTitle = CardTitle;
const AnimatedCardDescription = CardDescription;
const AnimatedCardContent = CardContent;
const AnimatedCardFooter = CardFooter;

export {
  AnimatedCard,
  AnimatedCardHeader,
  AnimatedCardTitle,
  AnimatedCardDescription,
  AnimatedCardContent,
  AnimatedCardFooter
};