import instance from '@/lib/axios';
import { unwrapApiResponse, type ApiResponse } from './types';

export type GetUserInfoResponse = {
  id: number;
  email: string;
  name: string;
  provider: string;
  profileImageUrl: string | null;
};

export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

export async function getMyInfo() {
  const { data } =
    await instance.get<ApiResponse<GetUserInfoResponse>>('/api/user/me');

  return unwrapApiResponse(data);
}
