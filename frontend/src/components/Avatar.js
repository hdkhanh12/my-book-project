'use client';

import Image from 'next/image';

export default function Avatar({ username, avatarUrl }) {
  if (!username) return null;

  // Nếu có avatarUrl, hiển thị ảnh thật
  if (avatarUrl) {
    return (
      <div className="w-10 h-10 relative rounded-full cursor-pointer">
        <Image
          src={`${process.env.NEXT_PUBLIC_API_URL}${avatarUrl}`} 
          alt={username}
          fill
          sizes="40px"
          className="rounded-full object-cover"
        />
      </div>
    );
  }

  // Nếu không, hiển thị chữ cái đầu như cũ
  const initial = username.charAt(0).toUpperCase();

  const gethashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash;
  };

  const hash = gethashCode(username);
  const r = (hash & 0xFF0000) >> 16;
  const g = (hash & 0x00FF00) >> 8;
  const b = hash & 0x0000FF;
  const bgColor = `rgb(${r}, ${g}, ${b})`;

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white cursor-pointer"
      style={{ backgroundColor: bgColor }}
    >
      {initial}
    </div>
  );
}