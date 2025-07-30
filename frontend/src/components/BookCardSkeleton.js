export default function BookCardSkeleton() {
  return (
    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 h-full">
      <div className="animate-pulse flex flex-col items-center h-full">
        <div className="w-32 h-48 bg-gray-300 dark:bg-gray-600 rounded-md mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      </div>
    </div>
  );
}