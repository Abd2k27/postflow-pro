import { Link } from 'react-router-dom';

export function AuthLegalLinks() {
  return (
    <p className="text-center text-xs leading-5 text-muted-foreground">
      By continuing, you agree to our{' '}
      <Link to="/terms" className="font-medium text-primary hover:underline">
        Terms of Service
      </Link>{' '}
      and{' '}
      <Link to="/privacy-policy" className="font-medium text-primary hover:underline">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
