import { useState } from 'react';
import { Song } from '@/types/song';
import MusicPlayer from '@/components/MusicPlayer';

interface CarouselProps {
  items: Song[];
  onSelect: (song: Song) => void;
}

const VISIBLE_COUNT = 5; // 2 on each side + center

export function SongCarousel({ items, onSelect }: CarouselProps) {
  const [centerIdx, setCenterIdx] = useState(0);

  const getDisplayItems = () => {
    const half = Math.floor(VISIBLE_COUNT / 2);
    const result = [];
    for (let i = -half; i <= half; i++) {
      let idx = (centerIdx + i + items.length) % items.length;
      result.push({ ...items[idx], offset: i });
    }
    return result;
  };

  const handleLeft = () => setCenterIdx((prev) => (prev - 1 + items.length) % items.length);
  const handleRight = () => setCenterIdx((prev) => (prev + 1) % items.length);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center w-full"
        style={{ height: 320 }}
        onWheel={(e) => {
          if (e.deltaY > 0) handleRight();
          else if (e.deltaY < 0) handleLeft();
        }}
      >
        <button
          onClick={handleLeft}
          className="absolute left-0 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full p-2"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        >
          &#8592;
        </button>
        <div className="flex items-center justify-center w-full overflow-hidden" style={{ scrollbarWidth: 'none' }}>
          {getDisplayItems().map((item, i) => {
            const scale = item.offset === 0 ? 1.2 : item.offset === -1 || item.offset === 1 ? 0.9 : 0.7;
            const opacity = item.offset === 0 ? 1 : 0.5;
            const zIndex = 10 - Math.abs(item.offset);
            const translateX = item.offset * 260; // more spacing between cards

            return (
              <div
                key={`${item.id}-${i}`}
                className="absolute transition-all duration-300 cursor-pointer"
                style={{
                  left: '50%',
                  transform: `translateX(-50%) translateX(${translateX}px) scale(${scale})`,
                  opacity,
                  zIndex,
                  width: 200,
                  height: 200,
                  boxShadow: item.offset === 0 ? '0 4px 32px #0008' : undefined,
                }}
                onClick={() => onSelect(item)}
              >
                <img
                  src={item.coverImage || '/default-cover.png'}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 w-full bg-black/70 text-white text-center py-2">
                  {item.title}
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={handleRight}
          className="absolute right-0 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full p-2"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        >
          &#8594;
        </button>
      </div>
    </div>
  );
}
