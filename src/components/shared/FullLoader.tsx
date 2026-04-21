export const FullLoader = ({ text }: { text: string }) => {
  return (
    <div className="fixed bg-white inset-0 flex flex-col items-center justify-center z-50">
      <div className="w-10 h-10 border-4 border-t-4 border-t-primary-base border-gray-200 rounded-full animate-spin"></div>
      <p className="mt-4 text-base font-medium text-grey-5">{text}</p>
    </div>
  );
};

export const ContainLoader = ({ text }: { text?: string }) => {
  return (
    <div className="flex items-center justify-center gap-2 w-full h-full">
      <div className="w-10 h-10 border-4 border-t-4 border-t-primary-base border-gray-200 rounded-full animate-spin"></div>
      <p className="text-base font-medium text-grey-5">{text}</p>
    </div>
  );
};
