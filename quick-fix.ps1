# Quick fix: Copy everything to main branch for GitHub Pages
Write-Host "🔧 Quick fix: Deploying to main branch..." -ForegroundColor Yellow

# Switch to main branch
git checkout main

# Copy our working files from feat branch
git checkout feat/initial-vib3-framework -- .

# Add and commit everything
git add -A
git commit -m "Deploy VIB3 framework to main for GitHub Pages"

# Push to main
git push origin main

# Switch back to our feature branch
git checkout feat/initial-vib3-framework

Write-Host "✅ Deployed to main branch! GitHub Pages should work now." -ForegroundColor Green
Write-Host "🌐 URLs should be live in 5-10 minutes:" -ForegroundColor Cyan
Write-Host "   https://domusgpt.github.io/vib3stylepack-production/" -ForegroundColor White
Write-Host "   https://domusgpt.github.io/vib3stylepack-production/digital-magazine/" -ForegroundColor White