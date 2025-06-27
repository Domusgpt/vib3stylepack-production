# Fix GitHub Pages Branch Configuration
Write-Host "🔧 Fixing GitHub Pages branch configuration..." -ForegroundColor Yellow

# Check current branch and status
Write-Host "📊 Current branch and files:" -ForegroundColor Cyan
git branch --show-current
git ls-files | grep -E "(index\.html|digital-magazine)" | head -10

# Check GitHub Pages current settings
Write-Host "📄 Current GitHub Pages settings:" -ForegroundColor Cyan
gh api repos/Domusgpt/vib3stylepack-production/pages

# Force update GitHub Pages to use main branch
Write-Host "🔄 Setting GitHub Pages to use main branch..." -ForegroundColor Yellow
gh api repos/Domusgpt/vib3stylepack-production/pages -X PATCH -f source[branch]=main -f source[path]=/

# Alternative: Delete and recreate Pages
Write-Host "♻️ If above failed, trying delete and recreate..." -ForegroundColor Yellow
gh api repos/Domusgpt/vib3stylepack-production/pages -X DELETE 2>$null
Start-Sleep -Seconds 3
gh api repos/Domusgpt/vib3stylepack-production/pages -X POST -f source[branch]=main -f source[path]=/

Write-Host "✅ GitHub Pages should now be configured for main branch!" -ForegroundColor Green
Write-Host "⏱️ Wait 5-10 minutes for changes to take effect." -ForegroundColor Yellow
Write-Host "🌐 Then check: https://domusgpt.github.io/vib3stylepack-production/" -ForegroundColor Cyan