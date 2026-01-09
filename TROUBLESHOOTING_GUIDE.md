# Al-Ghazaly App - Troubleshooting Guide
## Fixing Outdated UI / Stale Cache Issues

---

## 🔍 Problem Description

When running the React Native Expo app locally, an older version of the UI may appear instead of the latest code. This is typically caused by aggressive caching at multiple levels.

---

## ✅ Quick Fix (Run in Order)

### Step 1: Ensure Latest Code

```bash
# Navigate to project root
cd /app

# Fetch and pull latest changes
git fetch origin main
git reset --hard origin/main

# Verify you have the latest commit
git log --oneline -1
```

### Step 2: Clear All Caches

```bash
# Navigate to frontend directory
cd /app/frontend

# Stop any running processes
pkill -f metro
pkill -f expo

# Clear Metro bundler cache
rm -rf .metro-cache
rm -rf node_modules/.cache
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*

# Clear Expo cache
rm -rf .expo
rm -rf ~/.expo

# Clear Watchman cache (if installed)
watchman watch-del-all
```

### Step 3: Reinstall Dependencies

```bash
# Remove and reinstall node_modules
rm -rf node_modules
rm -f yarn.lock  # Optional: for completely fresh dependencies
yarn install
```

### Step 4: Start with Cache Clear

```bash
# Start Expo with cache clearing
yarn start --clear

# Or use npx directly
npx expo start --clear
```

### Step 5: Reload in Expo Go

On your device:
1. **Shake the device** to open the developer menu
2. Select **"Reload"**
3. If still showing old UI, select **"Clear cache and reload"** (if available)

---

## 🔧 Verification Checklist

After following the steps above, verify these optimizations are present:

### ProductCard.tsx
- ✅ `import { Image } from 'expo-image';`
- ✅ `cachePolicy="disk"` in Image component
- ✅ `React.memo(ProductCardComponent, ...)` export
- ✅ `useMemo` for computed values (displayName, brandName, etc.)
- ✅ `useCallback` for event handlers

### InteractiveCarSelector.tsx
- ✅ `useMemo` for filtered products, brands, models
- ✅ `useCallback` for all handlers and getName function
- ✅ `cachePolicy="disk"` on Image components

### useDataCacheStore.ts
- ✅ `partialize` function limits persisted data size
- ✅ Only essential data cached for offline use

---

## 📱 Version Indicator

The app now includes a version indicator in the Profile screen (bottom section). This helps confirm which version is running:

- **Version**: Shows app version from app.json
- **Build ID**: Format `YYYYMMDD.HHmm` (date and time based)
- **Tap 5 times**: Shows detailed technical info

---

## 🚨 Common Issues & Solutions

### Issue: Metro bundler shows old files
**Solution**: Kill all Metro processes and restart with `--clear`
```bash
pkill -f metro && npx expo start --clear
```

### Issue: AsyncStorage contains stale data
**Solution**: Clear app data on device
- **iOS Simulator**: Device → Erase All Content and Settings
- **Android Emulator**: Settings → Apps → [Your App] → Clear Data
- **Physical Device**: Uninstall and reinstall the app

### Issue: expo-image showing cached images
**Solution**: The `cachePolicy="disk"` ensures images are fresh. Clear device storage if needed.

### Issue: Node modules corrupted
**Solution**: Complete reinstall
```bash
rm -rf node_modules
rm -f yarn.lock
rm -f package-lock.json
yarn install
```

---

## 🏗️ CI/CD Best Practices

To prevent cache issues in production builds:

1. **Pre-build cache clear**: Add to your build script
```bash
rm -rf .expo .metro-cache node_modules/.cache
```

2. **Version bumping**: Update `version` in `app.json` for each release

3. **EAS Build**: Use `--clear-cache` flag
```bash
eas build --clear-cache --platform all
```

4. **GitHub Actions example**:
```yaml
- name: Clear caches
  run: |
    rm -rf frontend/.expo
    rm -rf frontend/.metro-cache
    rm -rf frontend/node_modules/.cache
```

---

## 📞 Still Having Issues?

If the problem persists:

1. Check the app version indicator in Profile
2. Compare commit hash with repository
3. Try a completely fresh clone:
```bash
cd /tmp
git clone https://github.com/AhmedSalahALghzaly/Go-ALghazaly-Final-go-Now.git fresh-clone
cd fresh-clone/frontend
yarn install
yarn start --clear
```

---

*Last updated: July 2025*
