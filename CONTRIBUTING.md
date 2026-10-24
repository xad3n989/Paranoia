# Contributing to PARANOIA

Thank you for your interest in contributing to PARANOIA! We welcome contributions from security researchers, network engineers, and privacy advocates.

## Development Workflow

1. **Fork the Repository**
2. **Clone your fork**:
   ```cmd
   git clone https://github.com/your-username/paranoia.git
   cd paranoia
   ```
3. **Install web console dependencies**:
   ```cmd
   npm install
   npm run dev
   ```
4. **Test Windows Batch scripts**:
   Always test changes to `.bat` or `.ps1` in an isolated Windows Sandbox or virtual machine before submitting pull requests.

## Code Standards
- **Windows Batch**: Ensure all environment variables are properly quoted (`"%~dp0"`), error codes checked (`%errorlevel%`), and elevation verified before privileged calls.
- **PowerShell**: Enforce `#Requires -RunAsAdministrator` and clean up registry keys on script exit.
- **Security First**: Under no circumstances should scripts allow unencrypted packets to bypass Tor when Killswitch is flagged.

## Reporting Vulnerabilities
Please report any critical security vulnerabilities or leak vectors directly via GitHub Private Vulnerability Reporting or open an issue marked `[SECURITY]`.
