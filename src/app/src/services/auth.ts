"use client";

import { countryCodes, initializeUI, oneTapSignIn } from "@firebase-oss/ui-core";
import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

import { firebaseConfig } from "./firebaseConfig";

export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(firebaseApp);

export const ui = initializeUI({
  app: firebaseApp,
  behaviors: [
    oneTapSignIn({
      clientId: "616577669988-led6l3rqek9ckn9t1unj4l8l67070fhp.apps.googleusercontent.com",
    }),
    countryCodes({
      allowedCountries: ["US", "CA", "IN"],
      defaultCountry: "IN",
    }),
  ],
});

if (import.meta.env.MODE === "development") {
  connectAuthEmulator(auth, "http://localhost:9099");
}
