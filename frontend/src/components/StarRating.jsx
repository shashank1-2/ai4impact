import { Star } from 'lucide-react';

export default function StarRating({ value = 0, onChange, size = 'md' }) {
  const sz = size === 'lg' ? 'h-7 w-7' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`${sz} ${i <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}
