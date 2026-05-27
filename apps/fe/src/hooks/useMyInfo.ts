'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyInfo, userKeys } from '@/apis/user';

const USER_INFO_STALE_TIME = 5 * 60 * 1000;

export function useMyInfo(enabled: boolean) {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: getMyInfo,
    enabled,
    retry: false,
    staleTime: USER_INFO_STALE_TIME,
  });
}
