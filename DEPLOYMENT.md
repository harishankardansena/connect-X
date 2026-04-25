# 🚀 Deployment Guide for Connect X

This project is now configured for deployment on **Render (Backend)** and **Vercel (Frontend)**. Follow these steps to go live!

---

## 1. Backend (Render)
Render will host your Node.js API and Socket.io server.

1.  **Create a New Web Service:** Go to [Render Dashboard](https://dashboard.render.com/) and create a new **Web Service**.
2.  **Connect Repo:** Link your GitHub repository.
3.  **Root Directory:** Set this to `backend`.
4.  **Runtime:** Node.
5.  **Build Command:** `npm install`
6.  **Start Command:** `npm start`
7.  **Environment Variables:** Add the following in the Render "Environment" tab:
    *   `NODE_ENV`: `production`
    *   `PORT`: `5000`
    *   `MONGO_URI`: (Your MongoDB Atlas connection string)
    *   `JWT_SECRET`: (Your secret key)
    *   `CLIENT_URL`: (Your Vercel URL, e.g., `https://connect-x.vercel.app`)
    *   `CLOUDINARY_CLOUD_NAME`: (From your Cloudinary dashboard)
    *   `CLOUDINARY_API_KEY`: (From your Cloudinary dashboard)
    *   `CLOUDINARY_API_SECRET`: (From your Cloudinary dashboard)

---

## 2. Frontend (Vercel)
Vercel will host your Vite/React frontend.

1.  **Create a New Project:** Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
2.  **Connect Repo:** Link your GitHub repository.
3.  **Root Directory:** Set this to `frontend`.
4.  **Framework Preset:** Vite.
5.  **Build Command:** `npm run build`
6.  **Output Directory:** `dist`
7.  **Environment Variables:** Add this in the Vercel "Environment Variables" tab:
    *   `VITE_API_URL`: (Your Render URL, e.g., `https://connect-x-backend.onrender.com`)

---

## 3. Important Checklist
- [ ] **CORS:** Ensure the `CLIENT_URL` on Render exactly matches your Vercel domain.
- [ ] **MongoDB Whitelist:** In MongoDB Atlas, go to "Network Access" and allow access from `0.0.0.0/0` (Render's IP addresses change dynamically).
- [ ] **Socket.io:** The code is now dynamic and will automatically connect to your Render backend once `VITE_API_URL` is set.

---
**Done!** Your app is now ready for the world. 🌍
