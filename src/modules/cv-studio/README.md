# CV Studio

CV Studio is an authenticated Personal Hub module that embeds the separately deployed application at `https://cv-studio-6a539.web.app/`.

## Route and ownership

- Personal Hub owns the launcher card, authentication gate and `/cv-studio/*` route.
- `CVStudioPage.jsx` owns the iframe shell, Hub navigation and external-tab fallback.
- The hosted CV Studio application owns all editor behavior, data, assets and deployment.
- Opening CV Studio does not create or update Personal Hub Firestore data.

## Integration boundary

The source URL is intentionally explicit in `CVStudioPage.jsx`. Do not add a parallel Firebase bootstrap, proxy or environment variable unless the hosting contract changes. If the hosted application starts sending `X-Frame-Options` or a CSP `frame-ancestors` directive that blocks Personal Hub, keep the external-tab link available and revisit the integration contract.

## Verification

For changes to this module:

```powershell
npm.cmd run lint
npm.cmd run build
```

Also verify `/hub` and `/cv-studio` in a browser while signed in, including the mobile header and “Mở tab mới” fallback.
