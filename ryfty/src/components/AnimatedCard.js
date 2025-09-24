"use client";

import { motion } from "framer-motion";

const AnimatedCard = ({ 
  children, 
  className = "", 
  delay = 0,
  ...props 
}) => {
  return (
    <motion.div
      className={`card ${className}`}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: delay,
        duration: 0.6
      }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
