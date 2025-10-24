## Network Request Visibility

The application provides options to control the visibility of API requests in the browser's network tab for security and privacy purposes.

### Environment Variables

Add this to your `.env` file:

```env
# Hide network requests from browser dev tools
VITE_HIDE_NETWORK_REQUESTS=true
```

### Options

#### 1. **Development vs Production Logging**
- ✅ **Development**: Requests are logged to console for debugging
- 🔒 **Production**: Requests are hidden (when `VITE_HIDE_NETWORK_REQUESTS=true`)

#### 2. **Request Deduplication**
- Prevents duplicate identical requests from appearing in network tab
- Reduces clutter from rapid API calls

#### 3. **Cache Control Headers**
- Adds `no-cache` headers to prevent request caching
- Makes requests less visible in network inspection

#### 4. **Console Logging Control**
- Only logs requests in development mode
- Dashboard analytics requests are filtered out to reduce noise

### Usage

**To hide requests completely:**
```env
VITE_HIDE_NETWORK_REQUESTS=true
```

**To show requests for debugging:**
```env
VITE_HIDE_NETWORK_REQUESTS=false
```

### Note
⚠️ **Completely hiding network requests may make debugging difficult.** Consider using development tools like Laravel Telescope or browser extensions for API monitoring instead.

### Alternative: Service Worker (Advanced)
For maximum request hiding, you can register a service worker that intercepts API requests. See `public/sw.js` for an example implementation.
