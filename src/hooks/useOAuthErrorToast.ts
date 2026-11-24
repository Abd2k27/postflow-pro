import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

/** Shows the error returned by oauth-callback (?error=...) once, then removes it from the URL. */
export function useOAuthErrorToast() {
  const [searchParams, setSearchParams] = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (!error) return;
    toast.error(`Account connection failed: ${error}`);
    const next = new URLSearchParams(searchParams);
    next.delete('error');
    setSearchParams(next, { replace: true });
  }, [error, searchParams, setSearchParams]);
}
