'use client';

/**
 * Logged Out Page
 * Direct component usage following Next.js best practices
 */

import {LoggedOutPage} from '@platform/auth';
import {Button} from '@mui/material';

export default function Page() {
  return <LoggedOutPage loginPath="/login" ButtonComponent={Button} />;
}
