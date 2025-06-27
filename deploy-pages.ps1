# GitHub Pages Deployment Script for VIB3 Framework
# Run this from Windows PowerShell in the project directory

Write-Host "🚀 Deploying VIB3 Framework to GitHub Pages..." -ForegroundColor Green

# Add and commit any new changes
Write-Host "📝 Committing changes..." -ForegroundColor Yellow
git add -A
git commit -m "feat: Production-ready GitHub Pages deployment with landing page"

# Push current branch
Write-Host "📤 Pushing feat/initial-vib3-framework branch..." -ForegroundColor Yellow
git push origin feat/initial-vib3-framework

# Set repository default
Write-Host "🔧 Setting repository default..." -ForegroundColor Yellow
gh repo set-default Domusgpt/vib3stylepack-production

# Update GitHub Pages to use the correct branch
Write-Host "📄 Updating GitHub Pages source..." -ForegroundColor Yellow
gh api repos/Domusgpt/vib3stylepack-production/pages -X PATCH -f source[branch]=feat/initial-vib3-framework -f source[path]=/

# Alternative command if the above fails
Write-Host "🔄 If the above failed, trying alternative method..." -ForegroundColor Yellow
gh api repos/Domusgpt/vib3stylepack-production/pages -X POST -f source[branch]=feat/initial-vib3-framework -f source[path]=/ 2>$null

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your VIB3 Framework will be available at:" -ForegroundColor Cyan
Write-Host "   Landing Page: https://domusgpt.github.io/vib3stylepack-production/" -ForegroundColor White
Write-Host "   Digital Magazine: https://domusgpt.github.io/vib3stylepack-production/digital-magazine/" -ForegroundColor White
Write-Host "   Core Demo: https://domusgpt.github.io/vib3stylepack-production/vib3-demo.html" -ForegroundColor White

Write-Host "⏱️  Note: GitHub Pages deployment may take 5-10 minutes to go live." -ForegroundColor Yellow
Write-Host "🔧 If the digital magazine still shows 404, the branch may need to be set in GitHub Pages settings manually." -ForegroundColor Red