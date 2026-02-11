import { motion } from 'framer-motion';

interface Step {
  id: number;
  title: string;
  icon: string;
  desc: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  isDark: boolean;
}

export default function StepIndicator({ steps, currentStep, isDark }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 md:gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide px-2">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center flex-shrink-0">
          <div className={`flex items-center gap-2 ${currentStep >= s.id ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
            <motion.div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                currentStep >= s.id 
                  ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-lg shadow-red-500/30' 
                  : (isDark ? 'bg-gray-800' : 'bg-gray-200')
              }`}
              initial={{ scale: 0.9 }}
              animate={{ scale: currentStep === s.id ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep > s.id ? (
                <motion.i 
                  className="fas fa-check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <span className="text-xs">{s.id}</span>
              )}
            </motion.div>
            <div className="hidden sm:block">
              <span className="text-sm font-medium">{s.title}</span>
              <p className={`text-xs ${currentStep >= s.id ? (isDark ? 'text-gray-400' : 'text-gray-500') : 'opacity-0'}`}>{s.desc}</p>
            </div>
          </div>
          {i < steps.length - 1 && (
            <motion.div 
              className={`w-6 md:w-10 h-1 mx-1 md:mx-2 rounded-full transition-colors duration-500 ${
                currentStep > s.id 
                  ? 'bg-gradient-to-r from-red-500 to-amber-500' 
                  : (isDark ? 'bg-gray-800' : 'bg-gray-200')
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
