'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

const useAuthRedirect = (redirectTo = '/login') => {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace(redirectTo);
    }
  }, [user, isUserLoading, router, redirectTo]);
};

export default useAuthRedirect;
