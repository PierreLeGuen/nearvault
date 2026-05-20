import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

const POLL_INTERVAL_MS = 60_000;

function getClientBuildId(): string {
  if (typeof window === "undefined") return "unknown";
  return (
    (window as unknown as { __NEXT_DATA__?: { buildId?: string } })
      .__NEXT_DATA__?.buildId ?? "unknown"
  );
}

async function fetchServerBuildId(): Promise<string | null> {
  try {
    const res = await fetch("/api/version", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { buildId?: string };
    return data.buildId ?? null;
  } catch {
    return null;
  }
}

export function useNewVersionCheck() {
  const notifiedRef = useRef(false);

  useEffect(() => {
    const clientBuildId = getClientBuildId();
    if (clientBuildId === "unknown" || clientBuildId === "dev") return;

    async function check() {
      if (notifiedRef.current) return;
      const serverBuildId = await fetchServerBuildId();
      if (!serverBuildId || serverBuildId === clientBuildId) return;

      notifiedRef.current = true;
      toast.info("A new version is available. Click here to refresh.", {
        autoClose: false,
        closeOnClick: false,
        onClick: () => window.location.reload(),
      });
    }

    const interval = setInterval(() => void check(), POLL_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void check();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
}
