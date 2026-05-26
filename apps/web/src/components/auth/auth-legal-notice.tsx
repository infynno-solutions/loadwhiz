import { Link } from "@tanstack/react-router";

import {
  authInlineLinkClass,
  authLegalClass,
} from "@/components/auth/auth-styles";

export function AuthLegalNotice() {
  return (
    <p className={authLegalClass}>
      By continuing, you agree to our{" "}
      <Link to="/terms" className={authInlineLinkClass}>
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link to="/privacy" className={authInlineLinkClass}>
        Privacy Policy
      </Link>
      .
    </p>
  );
}
