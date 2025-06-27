# Debug GitHub Pages Deployment
Write-Host "🔍 Debugging GitHub Pages configuration..." -ForegroundColor Yellow

# Check current branch
Write-Host "📊 Current branch:" -ForegroundColor Cyan
git branch --show-current

# Check GitHub Pages status
Write-Host "📄 GitHub Pages status:" -ForegroundColor Cyan
gh api repos/Domusgpt/vib3stylepack-production/pages

# Check what files are in our branch
Write-Host "📁 Files in current branch:" -ForegroundColor Cyan
git ls-tree -r --name-only HEAD | grep -E "(index\.html|digital-magazine)"

# Force push and update Pages
Write-Host "🔧 Force updating GitHub Pages..." -ForegroundColor Yellow
git push origin feat/initial-vib3-framework --force

# Delete and recreate Pages configuration
Write-Host "♻️ Recreating Pages configuration..." -ForegroundColor Yellow
gh api repos/Domusgpt/vib3stylepack-production/pages -X DELETE 2>$null
Start-Sleep -Seconds 2
gh api repos/Domusgpt/vib3stylepack-production/pages -X POST -f source[branch]=feat/initial-vib3-framework -f source[path]=/

Write-Host "✅ Debug complete! Check the URLs in 5-10 minutes." -ForegroundColor Green