"use client";

import { motion } from "framer-motion";
import { Loader2, MapPin } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  variant?: "spinner" | "pulse" | "dots" | "travel";
}

export function LoadingSpinner({ 
  size = "md", 
  text, 
  variant = "spinner" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  if (variant === "travel") {
    return (
      <div className="flex items-center justify-center">
        <motion.div
          animate={{
            y: [0, -8, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative inline-flex items-center justify-center"
        >
          <MapPin className={`${sizeClasses[size]} text-current`} />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className={`${sizeClasses[size]} rounded-full border-2 border-current opacity-30`} />
          </motion.div>
        </motion.div>
        {text && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-2 text-sm font-medium"
          >
            {text}
          </motion.span>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-3 w-3 bg-blue-600 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-600"
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <motion.div
          className={`${sizeClasses[size]} rounded-full bg-blue-600`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-600"
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  // Default spinner
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-3">
      <motion.div
        className={`${sizeClasses[size]} relative`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Loader2 className={`${sizeClasses[size]} text-blue-600`} />
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-600"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ count = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <motion.div
            className="h-48 bg-gray-200"
            animate={{
              background: [
                "linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)",
                "linear-gradient(90deg, #e0e0e0 0%, #f0f0f0 50%, #e0e0e0 100%)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <div className="p-4 space-y-3">
            <motion.div
              className="h-4 bg-gray-200 rounded w-3/4"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.1,
              }}
            />
            <motion.div
              className="h-3 bg-gray-200 rounded w-1/2"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.1 + 0.2,
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

