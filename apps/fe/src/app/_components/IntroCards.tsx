'use client';

import type { CSSProperties } from 'react';

export type SolutionCardProps = {
  title: string;
  desc: string;
  image: string;
};

function buildCardBackgroundStyle(image: string): CSSProperties {
  return {
    backgroundImage: `url(${image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}

export function SolutionCard({ title, desc, image }: SolutionCardProps) {
  return (
    <div
      className="relative flex h-[30rem] w-[30rem] flex-col justify-end overflow-hidden rounded-12 p-20"
      style={buildCardBackgroundStyle(image)}
    >
      <div className="flex flex-col gap-4">
        <p className="whitespace-pre-line text-body2 font-semibold text-white">
          {title}
        </p>
        <p className="line-clamp-2 whitespace-pre-line text-body4 text-white/70">
          {desc}
        </p>
      </div>
    </div>
  );
}

export type NewsCardProps = {
  tag: string;
  title: string;
  image: string;
};

export function NewsCard({ tag, title, image }: NewsCardProps) {
  return (
    <div
      className="relative flex h-[32rem] w-[60rem] flex-col justify-between overflow-hidden rounded-16 p-24"
      style={buildCardBackgroundStyle(image)}
    >
      <span className="inline-flex w-fit items-center rounded-full bg-white/90 px-12 py-4 text-body4 text-gray-900">
        {tag}
      </span>
      <p className="whitespace-pre-line text-body3 font-semibold text-white">
        {title}
      </p>
    </div>
  );
}
