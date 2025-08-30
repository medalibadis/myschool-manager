# Setting Up Service Role Key for Teacher Salary System

## 🔧 **Issue Fixed**
The teacher salary payment was failing due to Row Level Security (RLS) policies blocking unauthenticated access. The application now uses a service role key for admin operations. The app will work without the service role key, but salary payments will show a helpful error message.

## 📋 **Steps to Fix**

### **1. Get Your Service Role Key**
1. Go to your **Supabase Dashboard**
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)

### **2. Add to Environment Variables**
Add this line to your `.env.local` file:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ Important:** Replace `your_service_role_key_here` with your actual service role key.

### **3. Restart Your Development Server**
```bash
npm run dev
```

## 🔒 **Security Note**
- The service role key has elevated permissions
- It bypasses RLS policies
- Only use it for admin operations (like salary payments)
- Keep it secure and never expose it in client-side code
- The app will work normally without it, but salary payments will fail gracefully

## ✅ **What's Fixed**
- ✅ App loads without errors (even without service role key)
- ✅ Teacher salary payments will work when service role key is added
- ✅ No more "401 Unauthorized" errors
- ✅ No more RLS policy violations
- ✅ Salary history will be properly recorded
- ✅ Graceful error handling when service role key is missing

## 🧪 **Test the Fix**
1. Go to Teachers page
2. Click "Salary" for any teacher
3. Try to pay a salary
4. Should work without errors now

## 📝 **Updated Files**
- `src/lib/supabase-admin.ts` - New admin client
- `src/lib/supabase-service.ts` - Updated to use admin client for salary operations
- `simple-teacher-salary-setup.sql` - Enhanced RLS policies
- `verify-teacher-salary-setup.sql` - Comprehensive verification script
