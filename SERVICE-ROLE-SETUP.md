# 🔧 Service Role Key Setup Guide

## 🚨 Current Status
Your app is working perfectly! The salary payment feature just needs admin access to work.

## 📋 Quick Setup (2 minutes)

### Step 1: Get Your Service Role Key
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (not the anon key)

### Step 2: Add to Environment
Add this line to your `.env.local` file:
```
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

### Step 3: Restart
```bash
npm run dev
```

## ✅ What This Enables
- ✅ Teacher salary payments
- ✅ Salary history viewing
- ✅ All admin operations

## 🔒 Security Note
- The service role key has elevated permissions
- It's safe to use for admin operations
- The app works normally without it
- Only needed for salary management

## 🧪 Test
1. Go to **Teachers** page
2. Click **"Salary"** for any teacher
3. Try to **pay a salary**
4. Should work without errors!

## 📞 Need Help?
- Check the `setup-service-role.md` file for detailed instructions
- The error messages will guide you if something goes wrong
