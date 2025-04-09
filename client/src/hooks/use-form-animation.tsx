import { Variants } from "framer-motion";

export function useFormAnimation() {
  const staggerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemAnimation: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      }
    },
  };

  const formSubmitAnimation: Variants = {
    initial: { scale: 1 },
    loading: { 
      scale: 0.98,
      transition: {
        yoyo: Infinity,
        duration: 0.8,
      }
    },
    success: { 
      scale: 1.03,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
  };

  return {
    staggerAnimation,
    itemAnimation, 
    formSubmitAnimation,
  };
}