'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react'; 

export default function BookCard({ book }) {
  const [imgSrc, setImgSrc] = useState(
    book.volumeInfo?.imageLinks?.thumbnail 
      ? book.volumeInfo.imageLinks.thumbnail.replace('zoom=1', 'zoom=2') 
      : null
  );

  const title = book.volumeInfo.title || "Không có tiêu đề";
  const authors = book.volumeInfo.authors || [];
  const bookId = book.id;

  return (
    <Link href={`/book/${bookId}`} className="group h-full">
      <div className="border-2 border-[var(--navbar-border)] rounded-lg p-4 h-full flex flex-col items-center text-center transition-transform transform hover:scale-105 hover:shadow-lg">
        <div className="w-32 h-48 relative mb-4 flex-shrink-0">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={`Bìa sách ${title}`}
              fill
              sizes="(max-width: 768px) 50vw, 33vw" 
              priority
              className="object-contain"
              onError={() => setImgSrc(null)}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center p-2 rounded-md">
              <span className="text-xs font-bold text-center text-gray-600 dark:text-gray-300">
                {title}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col flex-grow justify-center">
            <h3 className="font-bold text-md mb-1 group-hover:text-blue-600 line-clamp-2">{title}</h3>
            <p className="text-sm text-[var(--muted-foreground)] line-clamp-1">{authors.join(', ')}</p>
        </div>
      </div>
    </Link>
  );
}