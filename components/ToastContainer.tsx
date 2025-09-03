
import React, { useEffect } from 'react';
import { useToast, ToastMessage, ToastType } from '../contexts/ToastContext';
import { CheckCircleIcon, XCircleIcon } from './Icons';

const TOAST_DURATION = 5000; // 5 seconds

const icons: Record<ToastType, React.FC<React.SVGProps<SVGSVGElement>>> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: CheckCircleIcon, // Placeholder, can be changed
};

const colors: Record<ToastType, { bg: string, text: string, icon: string }> = {
  success: { bg: 'bg-green-100 dark:bg-green-800/50', text: 'text-green-800 dark:text-green-200', icon: 'text-green-500 dark:text-green-400' },
  error: { bg: 'bg-red-100 dark:bg-red-800/50', text: 'text-red-800 dark:text-red-200', icon: 'text-red-500 dark:text-red-400' },
  info: { bg: 'bg-blue-100 dark:bg-blue-800/50', text: 'text-blue-800 dark:text-blue-200', icon: 'text-blue-500 dark:text-blue-400' },
};

const Toast: React.FC<{ toast: ToastMessage, onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const Icon = icons[toast.type];
  const color = colors[toast.type];

  return (
    <div className={`flex items-center w-full max-w-xs p-4 mb-4 ${color.text} ${color.bg} rounded-lg shadow-lg dark:shadow-black/30 animate-toast-in`} role="alert">
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${color.icon}`}>
        <Icon className="w-5 h-5" />
        <span className="sr-only">{toast.type} icon</span>
      </div>
      <div className="ml-3 text-sm font-medium">{toast.message}</div>
      <button
        type="button"
        className={`ml-auto -mx-1.5 -my-1.5 ${color.bg} ${color.text} rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex h-8 w-8`}
        onClick={() => onRemove(toast.id)}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
      </button>
    </div>
  );
};


const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <div className="fixed top-5 right-5 z-[100]">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
       <style>{`
        @keyframes toast-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-toast-in {
          animation: toast-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default ToastContainer;
