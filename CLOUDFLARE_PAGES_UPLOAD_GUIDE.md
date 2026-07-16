# Dogdream Cloudflare Pages Upload Guide

## Use This Method

For `dogdream`, use Cloudflare Dashboard manual upload as the default deploy path.

Do **not** keep retrying the failed `wrangler` OAuth localhost callback flow unless the user explicitly asks for it and there is a new working auth setup.

Primary production domain:

- `https://dogdreamspace.com/`

## What Failed Before

Avoid using this as the default path:

- `npx wrangler pages deploy dist --project-name dogdreamspace --branch main`
- OAuth callback URLs like `http://localhost:8976/oauth/callback?...`

Reason:

- this flow failed repeatedly on this machine because the localhost OAuth callback did not complete reliably

## Required Pre-Deploy Checks

Before uploading anything, confirm all of the following:

1. There are real local updates to publish
2. The updated page or feature works locally
3. A fresh production build has been created
4. The build output in `dist` is from the current workspace state

Do not assume a specific route forever.

If this deploy is about `seer-500`, verify that route locally.
If this deploy is about a different page, verify that page instead.

## Default Deploy Steps

1. Confirm what changed locally
2. Rebuild the site from `G:\正在工作\dogdream`
3. Log in to Cloudflare Dashboard in the browser
4. Open `Workers & Pages`
5. Open the project `dogdreamspace`
6. Click `Create deployment`
7. Keep the environment as `Production`
8. Upload the folder `G:\正在工作\dogdream\dist`
9. Wait until all files finish uploading
10. Click `Save and deploy`
11. Wait for the success screen before reporting success

## Verification Rules

After deploy, verify both:

1. the updated page on `dogdreamspace.pages.dev`
2. the updated page on `dogdreamspace.com`

Do not hard-code `seer-500` as the permanent verification path.

`/project/seer-500` is only a successful example from one session.
Always verify the actual page updated in the current deploy.

## Quick Success Checklist

- local changes confirmed
- fresh `dist` built
- correct Cloudflare project: `dogdreamspace`
- uploaded the full `dist` folder
- upload completed fully
- clicked `Save and deploy`
- success page appeared
- updated page works on `dogdreamspace.pages.dev`
- updated page works on `dogdreamspace.com`

## If Something Looks Wrong

If local is new but live is old:

1. confirm the uploaded `dist` came from the current workspace
2. upload manually again
3. verify preview and production separately

If an agent wants to retry `wrangler`:

- do not do that by default
- only retry if the user explicitly asks, or there is a new verified auth path
