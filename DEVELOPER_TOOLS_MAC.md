# How to Open Developer Tools on macOS

## Quick Reference

### Chrome/Edge/Brave
- **`Cmd + Option + I`** - Open Developer Tools (Easiest method)
- **`Cmd + Option + J`** - Open Console directly
- **`Fn + F12`** - If F12 doesn't work, use Fn key
- **Right-click → Inspect** - Right-click on any element

### Firefox
- **`Cmd + Option + I`** - Open Developer Tools
- **`Cmd + Option + K`** - Open Console directly
- **`Fn + F12`** - Alternative method

### Safari
1. **Enable Developer Menu first:**
   - Safari → Settings → Advanced
   - Check "Show Develop menu in menu bar"
2. **Open Developer Tools:**
   - **`Cmd + Option + C`** - Open Web Inspector
   - Or: Develop menu → Show Web Inspector

## Viewing Network Requests

Once Developer Tools is open:

1. **Click the "Network" tab** (or "Network" panel)
2. **Reload the page** (`Cmd + R`) to see all requests
3. **Filter requests** by type (XHR, Fetch, JS, CSS, etc.)
4. **Click on any request** to see:
   - Headers (Request/Response)
   - Payload (Request data)
   - Response (Server response)
   - Timing (Performance metrics)

## Useful Keyboard Shortcuts

- **`Cmd + R`** - Reload page (refresh network requests)
- **`Cmd + Shift + R`** - Hard reload (clear cache)
- **`Cmd + K`** - Clear console
- **`Esc`** - Toggle console/network panel

## Troubleshooting

### F12 doesn't work?
1. Hold **`Fn`** key while pressing **`F12`**
2. Or change system settings:
   - System Settings → Keyboard
   - Enable "Use F1, F2, etc. keys as standard function keys"

### Can't see Network tab?
- Make sure Developer Tools window is wide enough
- Look for tabs: Elements, Console, Network, Performance, etc.
- Network tab is usually the 3rd or 4th tab from the left

## Best Practice for Debugging API Calls

1. Open Developer Tools (`Cmd + Option + I`)
2. Go to **Network** tab
3. Filter by **XHR** or **Fetch** (for API requests)
4. Interact with your app (click buttons, submit forms)
5. Click on any request to see:
   - **Request URL** - The API endpoint
   - **Request Headers** - Authentication, content-type, etc.
   - **Request Payload** - Data sent to server
   - **Response** - Data received from server
   - **Status Code** - 200 (success), 400 (error), etc.

## Example: Debugging Attendance Update Issue

1. Open Developer Tools → Network tab
2. Filter by "XHR" or "Fetch"
3. Update attendance for a student
4. Look for requests to:
   - `/rest/v1/attendance` (attendance update)
   - `/rest/v1/payments` (payment creation - should NOT appear!)
5. Check if payment creation request is being made
6. Inspect the request payload and response

