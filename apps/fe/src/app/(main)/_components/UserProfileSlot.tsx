import type { CSSProperties } from 'react';
import type { GetUserInfoResponse } from '@/apis/user';

function getUserInitial(user: GetUserInfoResponse | undefined) {
  return user?.name?.trim().slice(0, 1).toUpperCase() || 'U';
}

function getProfileImageStyle(
  profileImageUrl: string | null | undefined,
): CSSProperties | undefined {
  const imageUrl = profileImageUrl?.trim();
  if (!imageUrl) return undefined;

  return {
    backgroundImage: `url("${imageUrl.replace(/["\\]/g, '\\$&')}")`,
  };
}

export default function UserProfileSlot({
  user,
  isLoading,
  isError,
}: {
  user: GetUserInfoResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <span
        aria-label="Loading profile"
        className="inline-flex h-36 w-36 animate-pulse rounded-full bg-gray-300"
      />
    );
  }

  const profileImageStyle = getProfileImageStyle(user?.profileImageUrl);

  return (
    <span
      aria-label={
        isError
          ? 'Profile unavailable'
          : user?.name
            ? `${user.name} profile`
            : 'Profile'
      }
      title={isError ? undefined : user?.email}
      style={profileImageStyle}
      className={`inline-flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-gray-300 text-body3 font-semibold text-gray-700 ${
        profileImageStyle ? 'bg-cover bg-center text-transparent' : ''
      }`.trim()}
    >
      {getUserInitial(user)}
    </span>
  );
}
