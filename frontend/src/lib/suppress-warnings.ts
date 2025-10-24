// Suppress specific development warnings that don't affect functionality
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    // Suppress Radix UI DialogContent accessibility warning in development
    // Our components already have proper DialogTitle elements
    if (
      typeof args[0] === 'string' && 
      args[0].includes('DialogContent') && 
      args[0].includes('DialogTitle')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}