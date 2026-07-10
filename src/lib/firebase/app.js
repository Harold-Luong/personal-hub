import { getApp, getApps, initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const requiredConfig = ['apiKey', 'projectId', 'appId']
const missingConfig = requiredConfig.filter((key) => !firebaseConfig[key])

if (missingConfig.length > 0) {
    throw new Error(
        `Missing Firebase config: ${missingConfig.join(', ')}. Check .env.local.`,
    )
}

export const firebaseApp = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)

const recaptchaV3SiteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;

if (!recaptchaV3SiteKey) {
    throw new Error('Missing VITE_RECAPTCHA_V3_SITE_KEY. Check .env.local.')
}

export const firebaseAppCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(recaptchaV3SiteKey),
    isTokenAutoRefreshEnabled: true,
})