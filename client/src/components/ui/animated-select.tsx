import React, { useState, forwardRef } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedSelectProps {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  className?: string;
  labelClassName?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

const AnimatedSelect = forwardRef<HTMLButtonElement, AnimatedSelectProps>(
  ({ 
    label, 
    options, 
    error, 
    className, 
    labelClassName, 
    id, 
    value, 
    defaultValue, 
    placeholder, 
    disabled, 
    onValueChange 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value || !!defaultValue);

    const handleValueChange = (newValue: string) => {
      setHasValue(!!newValue);
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    return (
      <div className="relative space-y-1">
        <Label 
          htmlFor={id} 
          className={cn(
            "transition-all duration-200",
            (isFocused || hasValue) && "text-primary text-xs",
            labelClassName
          )}
        >
          {label}
        </Label>
        
        <Select
          value={value}
          defaultValue={defaultValue}
          onValueChange={handleValueChange}
          disabled={disabled}
          onOpenChange={(open) => setIsFocused(open)}
        >
          <SelectTrigger 
            ref={ref} 
            id={id}
            className={cn(
              "w-full transition-all duration-200 border-2",
              isFocused && "border-primary ring-1 ring-primary/20",
              error && "border-destructive",
              className
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          
          <SelectContent>
            <AnimatePresence>
              {options.map((option) => (
                <motion.div
                  key={option.value}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <SelectItem value={option.value}>{option.label}</SelectItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </SelectContent>
        </Select>
        
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-destructive mt-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        
        {isFocused && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left"
          />
        )}
      </div>
    );
  }
);

AnimatedSelect.displayName = "AnimatedSelect";

export { AnimatedSelect };