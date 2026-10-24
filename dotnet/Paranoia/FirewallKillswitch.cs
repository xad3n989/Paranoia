using System;
using System.Diagnostics;

namespace Paranoia
{
    public static class FirewallKillswitch
    {
        public static bool IsArmed { get; private set; } = true;
        public static bool IsEmergencyLockdown { get; private set; } = false;

        public static void Arm()
        {
            RunNetsh("advfirewall firewall add rule name=\"PARANOIA_BLOCK_OUT\" dir=out action=block protocol=ANY remoteip=any enable=yes");
            RunNetsh("advfirewall firewall add rule name=\"PARANOIA_ALLOW_TOR\" dir=out action=allow program=\"tor.exe\" enable=yes");
            RunNetsh("advfirewall firewall add rule name=\"PARANOIA_ALLOW_LOCAL\" dir=out action=allow remoteip=127.0.0.1 enable=yes");
            IsArmed = true;
            IsEmergencyLockdown = false;
        }

        public static void Disarm()
        {
            RunNetsh("advfirewall firewall delete rule name=\"PARANOIA_BLOCK_OUT\"");
            RunNetsh("advfirewall firewall delete rule name=\"PARANOIA_ALLOW_TOR\"");
            RunNetsh("advfirewall firewall delete rule name=\"PARANOIA_ALLOW_LOCAL\"");
            RunNetsh("advfirewall firewall delete rule name=\"PARANOIA_EMERGENCY_DROP\"");
            IsArmed = false;
            IsEmergencyLockdown = false;
        }

        public static void TriggerEmergencyLockdown()
        {
            IsEmergencyLockdown = true;
            RunNetsh("advfirewall firewall add rule name=\"PARANOIA_EMERGENCY_DROP\" dir=out action=block protocol=ANY enable=yes");
        }

        private static void RunNetsh(string args)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "netsh",
                    Arguments = args,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                using var p = Process.Start(psi);
                p?.WaitForExit(1000);
            }
            catch { }
        }
    }
}
