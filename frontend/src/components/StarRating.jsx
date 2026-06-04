export default function StarRating({ value = 0, onChange, size = 'md' }) {
  const textSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <div className={`flex gap-1 font-mono ${textSize}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={`${onChange ? 'cursor-pointer hover:text-[#1a5f5f]' : 'cursor-default'} transition-colors`}
        >
          {i <= value ? '[★]' : '[☆]'}
        </button>
      ))}
    </div>
  );
}
