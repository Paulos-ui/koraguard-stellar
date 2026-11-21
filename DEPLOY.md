# Deployment and repository setup

## Push to your EXISTING empty repository

Unzip this ZIP to a local folder. From inside that folder:

```bash
git init
git branch -M main
git remote add origin https://github.com/paulos-ui/koraguard-stellar.git
git add -A
git commit -m "feat: launch KoraGuard initial Stellar build"
git push -u origin main
```

If the existing repository is not actually empty by the time you push, do not force push. Clone it first, copy the files into the clone and commit on top of its history.

If using WSL or Windows, run these commands inside the folder that contains package.json. Do not upload node_modules, wallet credentials, or private keys.

## Vercel

1. Import `paulos-ui/koraguard-stellar` into Vercel.
2. Framework: Next.js. Root directory: repository root.
3. Node.js: use 22.x or newer supported by the package and Vercel.
4. Optional env: `NEXT_PUBLIC_STELLAR_HORIZON=https://horizon-testnet.stellar.org`.
5. Build command: `npm run build`.

The web UI depends on the wallet extension or a supported in-wallet mobile browser. The first version is Testnet-only.

**No secrets or admin passwords belong in `NEXT_PUBLIC_` variables.**

## Android phone only

The official GitHub Mobile app cannot reliably upload this whole multi-folder project as a ZIP. For a phone-only workflow, see [docs/MOBILE_GITHUB.md](docs/MOBILE_GITHUB.md). It covers Termux installation, cloning the existing repository, preserving Git history, committing and pushing without a PC.
