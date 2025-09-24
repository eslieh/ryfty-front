"use client";

import { motion } from "framer-motion";

const AnimatedButton = ({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary",
  size = "default",
  disabled = false,
  ...props 
}) => {
  const baseClasses = "btn";
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    destructive: "btn-destructive"
  };
  
  const sizeClasses = {
    sm: "btn-sm",
    default: "",
    lg: "btn-lg",
    icon: "btn-icon"
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

  return (
    <motion.button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ 
        scale: 1.02,
        boxShadow: variant === "primary" 
          ? "0 8px 25px rgba(0, 145, 90, 0.3)" 
          : "0 8px 25px rgba(0, 0, 0, 0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }}
      {...props}
    >
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

export default AnimatedButton;
