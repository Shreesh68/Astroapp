# AIAstrology on Google Play

Everything the Play Console asks for, ready to paste. Package `com.karnatakamatch.app`, app name **AIAstrology**.

## Build a release

```bash
npm run build:android
cd android && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab
```

- The upload key is `~/AndroidKeystores/aiastrology-upload.jks`, with its password in `aiastrology-upload.properties` next to it. It is not in git.
- Back up both files somewhere safe (a password manager or a USB drive). Without them you cannot sign updates. Google can reset a lost upload key, but that takes days.
- Before every new upload, raise `versionCode` (1, 2, 3, …) and `versionName` in `android/app/build.gradle`.

## Links

| What | URL |
|---|---|
| Privacy policy | https://karnatakamatch-chat.astrology-app.workers.dev/privacy |
| Account deletion | https://karnatakamatch-chat.astrology-app.workers.dev/delete-account |

Both pages are served by the chat server (`worker/src/pages.js`).

## Store listing

**App name:** AIAstrology

**Short description** (80 characters max):
> Kannada & English birth charts, kundli matching, Panchang and an AI astrologer

**Full description:**
```
AIAstrology makes Vedic astrology simple, in Kannada or English.

★ BIRTH CHART (JATAKA)
Your Moon sign (rashi), nakshatra and Lagna explained in plain words, a South Indian chart you can tap house by house, and your Vimshottari dasha timeline with every sub-period. Includes a careful Kuja dosha (Mangal dosha) check with the South Indian exemptions.

★ KUNDLI MATCHING
Traditional 36-guna Ashtakoota matching with Nadi and Bhakoot cancellations, plus the South Indian checks families in Karnataka rely on: Rajju, Vedha, Mahendra and Stree Deergha. Kuja dosha is compared between both charts, and the ages of the bride and groom are shown.

★ PANCHANG
Today's tithi, nakshatra, yoga and karana with end times, sunrise and sunset, Rahu Kala, Yamaganda and Gulika, and the Samvatsara, Maasa and Rutu, for any place.

★ ASK THE AI ASTROLOGER
Chat with Jyotishi, an AI astrologer that reads your own chart: career, marriage, money, health, dasha periods, Sade Sati and more. Answers are worked out from your chart's actual planet positions and periods, in Kannada or English.

★ MADE FOR KARNATAKA
Full Kannada interface, amanta lunar months as followed in Karnataka, and search for any town or village in India.

★ PRIVATE BY DESIGN
Charts are calculated on your phone, so they work without internet. Logging in is optional: log in with Google only if you want your kundlis saved to your account and back on a new phone.

Astrology is for guidance and interest. AI answers can be wrong and are not medical, legal or financial advice.
```

**Category:** Lifestyle. **Tags:** Astrology, Horoscope.
**Contact email:** shreesh.hegde00@gmail.com.

**Graphics** (in `~/Desktop/AIAstrology-PlayStore/`):
- App icon: `icon-512.png`
- Feature graphic: `feature-graphic.png`
- Phone screenshots: `screenshots-en/`, plus `screenshots-kn/` for a Kannada (kn-IN) listing

## App content (Policy → App content)

| Form | Answer |
|---|---|
| Privacy policy | the privacy URL above |
| App access | All functionality is available without special access (login is optional) |
| Ads | No, the app does not contain ads |
| Content rating | Category "All other app types"; answer No to violence, sexuality, language, drugs and gambling. Answer **Yes** to user-generated/shared content only if asked about users talking to each other (they don't; the AI chat is private). Expected result: Everyone / PEGI 3 / IARC 3+ |
| Target audience | 18 and over (avoids the Families policy). Not appealing to children |
| News app | No |
| COVID-19 app | No |
| Data safety | see below |
| Government app | No |
| Financial features | None |
| Health | Not a health app |
| Generative AI | Yes: the app generates text with AI. In-app reporting is the "⚑ Report" link under every AI answer |

### Data safety

- **Does the app collect or share user data?** Yes.
- **Is all data encrypted in transit?** Yes.
- **Can users request deletion?** Yes, in the app (My account → Delete my account) and at the deletion URL.

| Data type | Collected | Shared | Optional? | Purpose |
|---|---|---|---|---|
| Personal info → Name | Yes | No | Optional (login) | Account management, App functionality |
| Personal info → Email address | Yes | No | Optional (login) | Account management |
| Personal info → User IDs | Yes | No | Optional (login) | Account management |
| Personal info → Other info (birth date, time, place, gender of saved people) | Yes | No | Optional (stored only when logged in, or sent with AI questions) | App functionality |
| Messages → Other in-app messages (questions to the AI astrologer) | Yes | No | Optional | App functionality |

Answer **No** to processed ephemerally only where the data is stored in the account, and **Yes** for AI questions, since the server does not store them. Location, contacts, photos, files, app activity, device IDs and financial data are **not** collected: place search sends the typed text, not the device location. Cloudflare and Firebase act as service providers, which Google does not count as "sharing".

## Release steps

1. **Closed testing first.** Personal developer accounts created after November 2023 must run a closed test with at least 12 testers for 14 days before production. Testing → Closed testing → Create track → add testers' Gmail addresses (an email list) → upload `app-release.aab` → roll out. Testers join through the opt-in link.
2. **Play App Signing.** When uploading the first bundle, accept Google-managed signing.
3. **Make Google login work in the Play build.** Play re-signs the app with its own key. Copy the SHA-1 and SHA-256 from Test and release → Setup → **App signing** → *App signing key certificate*, then run:
   ```bash
   npx --yes firebase-tools@15.34.1 apps:android:sha:create 1:487030522623:android:a9206f4f60a6118ad402ca <SHA-1> --project karnatakamatch-7bb64
   ```
   Do the same for the SHA-256. Until this is done, "Continue with Google" fails in the installed-from-Play app. Everything else works.
4. After 14 days, apply for production access (Dashboard), answer the short questionnaire about the test, then Production → Create release with the same or a newer bundle.
