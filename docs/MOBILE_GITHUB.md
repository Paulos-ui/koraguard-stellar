# Push KoraGuard to GitHub from Android

The official GitHub Mobile app is useful for reviewing repositories, issues and code, but it is not the right tool for uploading a complete nested Next.js project ZIP. **Do not upload the ZIP as a single repository file**. GitHub needs the extracted source files with their folder structure preserved.

## Recommended: Termux + Git on your Android phone

Install Termux from its official F-Droid distribution or the official `termux/termux-app` GitHub releases. Avoid old third-party APKs. Termux is a local terminal and does not require a desktop computer.

1. Download the KoraGuard ZIP to the phone's `Download` folder. Do not unzip inside GitHub Mobile.
2. Open Termux and run the following commands, one block at a time.

```bash
pkg update
pkg install git unzip
termux-setup-storage
```

Allow Android file access when asked.

3. Set Git identity using your own real GitHub details, then clone the existing repository.

```bash
git config --global user.name "paulos-ui"
git config --global user.email "YOUR_GITHUB_EMAIL"
cd ~
git clone https://github.com/paulos-ui/koraguard-stellar.git
cd koraguard-stellar
```

4. Unzip the project **into the cloned folder** (the actual ZIP filename may differ). This keeps `.git` untouched.

```bash
unzip -oq ~/storage/downloads/KoraGuard-Stellar-V0.1.1.zip -d .
ls -la
```

You should see `package.json`, `app`, `contracts`, `README.md`, and `docs`. If you don't, stop and check the ZIP filename and the target directory.

5. Commit and push:

```bash
git add -A
git commit -m "feat: initialize KoraGuard Stellar buildathon source"
git branch -M main
git push -u origin main
```

GitHub no longer accepts your account password for Git over HTTPS. If prompted for a password, use a **fine-grained personal access token** created from your GitHub account, scoped to `paulos-ui/koraguard-stellar` with **Contents: Read and write**. Never paste your token into chat, code, or screenshots. Prefer a short-expiry token. You can also use SSH keys if you already have them configured.

Return to the repository in GitHub Mobile and refresh. You should see the source folders and a rendered README.

## Browser alternative

In Chrome on Android, sign into GitHub, open the repository, turn on **Desktop site**, then choose **Add file → Upload files**. You must upload **extracted files**, not the ZIP itself. GitHub's web uploader can handle file uploads, but folder selection on Android varies; nested folders and hidden files such as `.github` may require extra work. For this project, Termux is more reliable.

## Troubleshooting

- `No such file`: check the ZIP's name and whether your browser saved it in Downloads (`ls ~/storage/downloads/`).
- `Permission denied` for Downloads: rerun `termux-setup-storage` and grant Android access.
- `Authentication failed`: use a fine-grained GitHub token with repository contents write permission, not your GitHub password.
- `Nothing to commit`: confirm you unzipped files into the cloned `koraguard-stellar` directory.
- `Non-fast-forward`: someone added commits to GitHub. Run `git pull --rebase origin main`, resolve any conflicts, then push; **never force-push just to bypass the problem**.

The project currently needs desktop/CI validation before it should be described as production-ready. GitHub Actions can run the policy tests once the files are pushed.
