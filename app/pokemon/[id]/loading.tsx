export default function PokemonDetailSkeleton() {
    return (
      <div className="animate-pulse p-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Image placeholder */}
          <div className="w-48 h-48 bg-gray-200 rounded-full" />
          
          {/* Name placeholder */}
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          
          {/* Types placeholder */}
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
          
          {/* Stats section */}
          <div className="w-full space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
          
          {/* Abilities section */}
          <div className="w-full mt-4 space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }