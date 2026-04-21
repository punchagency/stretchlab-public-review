export const Spinner = ({ className }: { className?: string }) => {
  
  const hasBorderColor = className?.includes('border-');
  const defaultBorderColor = hasBorderColor ? '' : 'border-white';
  
  return (
    <div className={`w-4 h-4 border-t-2 border-b-2 ${defaultBorderColor} rounded-full animate-spin ${className || ''}`}></div>
  );
};
