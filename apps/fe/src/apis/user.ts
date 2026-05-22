import instance from '@/lib/axios';
import { unwrapApiResponse, type ApiResponse } from './types';

export type GetUserInfoResponse = {
  id: number;
  email: string;
  name: string;
  provider: string;
  profileImageUrl?: string | null;
};

export async function getMyInfo() {
  const { data } =
    await instance.get<ApiResponse<GetUserInfoResponse>>('/api/user/me');

  return unwrapApiResponse(data);
}
