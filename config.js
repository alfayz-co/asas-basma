// إعدادات Firebase لمشروع asas-basma
export const firebaseConfig = {
  apiKey: "AIzaSyDE36KQb7L_OBLePUYm2G0PGlRfU3KB_FM",
  authDomain: "asas-basma.firebaseapp.com",
  projectId: "asas-basma",
  storageBucket: "asas-basma.firebasestorage.app",
  messagingSenderId: "654893084084",
  appId: "1:654893084084:web:594abb5c7983e61c7856e1",
  measurementId: "G-HTN89JFZYX"
};

// UID حساب المالك من Firebase > Authentication > Users
// لازم يكون نفس الرقم المكتوب في firestore.rules
export const OWNER_UID = "Pl63PqyCdVNyPFFfcHyjDPjRp3n2";

// الموظف يدخل برقمه الوظيفي، والتطبيق يحوّله لإيميل داخلي بالشكل ده
export const EMAIL_DOMAIN = "asas-basma.app";
