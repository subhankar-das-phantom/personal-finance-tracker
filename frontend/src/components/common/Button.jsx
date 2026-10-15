import React from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 border border-transparent',
  secondary: 'bg-slate-100 dark:bg-[#161c2b] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/5 shadow-sm',
  outline: 'bg-transparent border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5',
  ghost: 'bg-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 border border-transparent',
};

const sizes = {
  sm: 'px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold',
  md: 'px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold',
  lg: 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold',
};

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false, 
  disabled = false, 
  icon: Icon,
  type = 'button',
  onClick,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  return (
    <motion.button
      type={type}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={`w-4 h-4 ${children ? 'mr-1.5' : ''}`} />}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default Button;
