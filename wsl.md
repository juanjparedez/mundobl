## Exposing WSL2 Dev Server on Windows 11 LAN

To access a dev server running inside WSL2 from other devices on your local network:

### 1. Port Proxy

Forward traffic from Windows to WSL. Run in PowerShell (as admin):
```powershell
# Get WSL IP
wsl hostname -I

# Create port forwarding rule (replace <WSL_IP> with the IP from above)
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=<WSL_IP>

# Verify
netsh interface portproxy show v4tov4
```

> ⚠️ The WSL IP changes on every restart. Update the rule accordingly or automate it with a script.

### 2. Firewall Rule

Allow inbound traffic on the port:
```powershell
New-NetFirewallRule -DisplayName "WSL Port 3000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000
```

### 3. IP Helper Service (Critical)

The `iphlpsvc` (IP Helper) service **must be running** for port proxy to work:
```powershell
# Check status
Get-Service iphlpsvc

# Start if stopped
Start-Service iphlpsvc

# Ensure it starts automatically on boot
Set-Service iphlpsvc -StartupType Automatic
```

### 4. Start the Dev Server Bound to All Interfaces

Make sure your dev server listens on `0.0.0.0`, not just `localhost`:
```bash
# Example with Next.js
next dev --hostname 0.0.0.0
```

### Quick Troubleshooting

| Symptom | Check |
|---|---|
| Connection refused from LAN | `Get-Service iphlpsvc` — is it running? |
| Works on WSL IP but not Windows IP | `netsh interface portproxy show v4tov4` — is the WSL IP current? |
| No LISTEN on Windows | `netstat -ano \| findstr ":3000.*LISTEN"` — restart `iphlpsvc` |
| Blocked from other devices | Verify firewall rule exists for the port |s