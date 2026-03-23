import instance from '@/lib/axios';

/**
 * API 요청 함수 예시 - 실제 API에 맞게 수정하세요.
 * 이 파일은 참고용이며, 불필요하면 삭제해도 됩니다.
 */
export const getUsers = async () => {
  const { data } = await instance.get('/users');
  return data;
};

export const getUserById = async (id: string) => {
  const { data } = await instance.get(`/users/${id}`);
  return data;
};
