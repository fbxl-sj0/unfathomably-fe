import clsx from 'clsx';
import { useEffect, useState } from 'react';

import Avatar from '@/components/ui/avatar.tsx';
import { GroupRoles } from '@/schemas/group-member.ts';

import type { Group } from '@/schemas/index.ts';

interface IGroupAvatar {
  group: Group;
  size: number;
  withRing?: boolean;
  fallbackSrc?: string;
}

const GroupAvatar = (props: IGroupAvatar) => {
  const { fallbackSrc, group, size, withRing = false } = props;
  const [avatarSrc, setAvatarSrc] = useState(group.avatar);

  const isOwner = group.relationship?.role === GroupRoles.OWNER;

  useEffect(() => {
    const controller = new AbortController();
    setAvatarSrc(group.avatar);

    if (fallbackSrc && fallbackSrc !== group.avatar) {
      try {
        const avatarUrl = new URL(group.avatar, window.location.origin);

        if (avatarUrl.origin === window.location.origin && avatarUrl.pathname.startsWith('/proxy/')) {
          void fetch(avatarUrl, { method: 'HEAD', signal: controller.signal }).then((response) => {
            const disposition = response.headers.get('content-disposition') || '';

            if (disposition.includes('remote-media-unavailable')) {
              setAvatarSrc(fallbackSrc);
            }
          }).catch(() => undefined);
        }
      } catch {
        setAvatarSrc(fallbackSrc);
      }
    }

    return () => controller.abort();
  }, [fallbackSrc, group.avatar]);

  return (
    <Avatar
      className={
        clsx('relative rounded-full', {
          'shadow-[0_0_0_2px_theme(colors.primary.600),0_0_0_4px_theme(colors.white)]': isOwner && withRing,
          'dark:shadow-[0_0_0_2px_theme(colors.primary.600),0_0_0_4px_theme(colors.gray.800)]': isOwner && withRing,
          'shadow-[0_0_0_2px_theme(colors.primary.600)]': isOwner && !withRing,
          'shadow-[0_0_0_2px_theme(colors.white)] dark:shadow-[0_0_0_2px_theme(colors.gray.800)]': !isOwner && withRing,
        })
      }
      src={avatarSrc}
      size={size}
    />
  );
};

export default GroupAvatar;
