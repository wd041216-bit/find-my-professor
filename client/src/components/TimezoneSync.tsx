import { useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

/**
 * TimezoneSync component
 * Automatically detects and syncs user's timezone to the server
 * Should be mounted once in App.tsx
 */
export function TimezoneSync() {
  const { user } = useAuth();
  const updateTimezoneMutation = trpc.auth.updateTimezone.useMutation();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Only sync once per session when user logs in
    if (user && !hasSynced.current) {
      try {
        // Get user's timezone using Intl API
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        console.log(`[TimezoneSync] Detected timezone: ${timezone}`);
        
        // Update timezone on server
        updateTimezoneMutation.mutate({ timezone }, {
          onSuccess: () => {
            console.log(`[TimezoneSync] Successfully synced timezone: ${timezone}`);
            hasSynced.current = true;
          },
          onError: (error) => {
            console.error(`[TimezoneSync] Failed to sync timezone:`, error);
          }
        });
      } catch (error) {
        console.error(`[TimezoneSync] Failed to detect timezone:`, error);
      }
    }
  }, [user, updateTimezoneMutation]);

  // This component doesn't render anything
  return null;
}
