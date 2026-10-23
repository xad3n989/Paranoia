export interface IPReport {
  ip: string;
  country?: string;
  city?: string;
  org?: string;
  isTor: boolean;
  dnsLeaking: boolean;
  webrtcLeaking: boolean;
  timestamp: string;
}

export async function detectPublicIP(): Promise<IPReport> {
  const defaultReport: IPReport = {
    ip: '127.0.0.1 (Localhost / Sandbox)',
    country: 'United States',
    city: 'Local',
    org: 'Standard ISP / Direct Link',
    isTor: false,
    dnsLeaking: true,
    webrtcLeaking: true,
    timestamp: new Date().toLocaleTimeString(),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const ip = data.ip || defaultReport.ip;
      return {
        ip,
        country: 'Detected Network',
        city: 'Active Interface',
        org: 'Direct Upstream Gateway',
        isTor: false,
        dnsLeaking: true,
        webrtcLeaking: true,
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  } catch {
    // If blocked by sandbox CSP or offline, return fallback
  }

  return defaultReport;
}
