'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchIcon from '@/assets/icons/search.svg';

const SEARCH_PARAM_KEY = 'q';
const SEARCH_DEBOUNCE_MS = 250;

export default function DataSourceSearchInput({
  pathname,
}: {
  pathname: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const querySearchValue = searchParams.get(SEARCH_PARAM_KEY) ?? '';
  const [searchDraft, setSearchDraft] = useState(() => ({
    sourceQueryValue: querySearchValue,
    value: querySearchValue,
  }));
  const searchValue =
    searchDraft.sourceQueryValue === querySearchValue
      ? searchDraft.value
      : querySearchValue;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParamsString);
      const trimmedValue = searchValue.trim();

      if (trimmedValue) {
        params.set(SEARCH_PARAM_KEY, trimmedValue);
      } else {
        params.delete(SEARCH_PARAM_KEY);
      }

      const queryString = params.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
      const currentUrl = searchParamsString
        ? `${pathname}?${searchParamsString}`
        : pathname;

      if (currentUrl !== nextUrl) {
        router.replace(nextUrl, { scroll: false });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, router, searchParamsString, searchValue]);

  return (
    <div className="flex items-center gap-8 rounded-full border border-gray-300 bg-white px-12 py-8">
      <SearchIcon aria-hidden className="icon-16 text-gray-500" />
      <input
        type="search"
        aria-label="데이터 소스 검색"
        value={searchValue}
        onChange={(event) =>
          setSearchDraft({
            sourceQueryValue: querySearchValue,
            value: event.target.value,
          })
        }
        placeholder="찾고 싶은 데이터 소스를 입력해주세요."
        className="w-[26rem] bg-transparent text-body4 text-gray-900 outline-none placeholder:text-gray-500"
      />
    </div>
  );
}
