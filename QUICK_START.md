# ⚡ Quick Start - 3 Minutes to Running App

## Step 1: Setup (1 minute)

```bash
# Navigate to project
cd "Real Estate Web Application"

# Install dependencies
npm install
```

## Step 2: Configure (1 minute)

Edit `.env` file with your AWS credentials:

```env
VITE_AWS_ACCESS_KEY_ID=your_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key
VITE_S3_BUCKET_NAME=your_bucket
VITE_DUMMY_DATA=true
```

## Step 3: Run (1 minute)

```bash
# Start dev server
npm run dev
```

Visit: `http://localhost:5173/`

---

## 🔐 Login Credentials

```
Email: admin@realestate.com
Password: Admin123!
```

---

## 📊 View Dummy Properties

Dummy data is automatically available! If you don't see them:

1. Make sure `.env` has `VITE_DUMMY_DATA=true`
2. Restart dev server
3. Hard refresh browser (Ctrl+Shift+R)

---

## 🌱 Seed Your Own Data

Upload the 8 pre-built properties to S3:

```bash
npm run seed
```

---

## 📁 Key Files

- **Login**: Admin uses hardcoded credentials in `authService.ts`
- **Dummy Data**: 8 properties defined in `seedService.ts`
- **Storage**: All S3 operations in `storageService.ts`
- **Toggle**: Set `VITE_DUMMY_DATA=true/false` in `.env`

---

**That's it! Happy coding! 🚀**
