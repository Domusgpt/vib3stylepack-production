# Enable GitHub Pages for VIB3StylePack Production
Write-Host "🚀 Enabling GitHub Pages for VIB3StylePack..." -ForegroundColor Green

# Ensure we're authenticated
Write-Host "🔐 Checking GitHub authentication..." -ForegroundColor Yellow
gh auth status

# Set the repository as default
Write-Host "🎯 Setting repository default..." -ForegroundColor Yellow
gh repo set-default Domusgpt/vib3stylepack-production

# Enable GitHub Pages on main branch
Write-Host "📄 Enabling GitHub Pages on main branch..." -ForegroundColor Yellow
gh api repos/Domusgpt/vib3stylepack-production/pages -X POST -f source[branch]=main -f source[path]=/ --jq '.html_url'

# Verify Pages is enabled
Write-Host "✅ Verifying GitHub Pages configuration..." -ForegroundColor Green
gh api repos/Domusgpt/vib3stylepack-production/pages --jq '{url: .html_url, status: .status, source: .source}'

Write-Host "🌐 Your VIB3 Framework will be live at:" -ForegroundColor Cyan
Write-Host "   https://domusgpt.github.io/vib3stylepack-production/" -ForegroundColor White
Write-Host "   https://domusgpt.github.io/vib3stylepack-production/digital-magazine/" -ForegroundColor White

Write-Host "⏱️ GitHub Pages deployment usually takes 5-10 minutes." -ForegroundColor Yellow