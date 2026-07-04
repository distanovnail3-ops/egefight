# Upload To GitHub

This project is a static browser game. It can be hosted with GitHub Pages from the repository root.

## Upload In Browser

1. Create a new GitHub repository.
2. Extract `github-upload.zip` first. Do not upload the `.zip` file itself: GitHub Pages will not unpack it.
3. Upload the extracted files into the repository root. The repository root must show `index.html` directly, not inside another folder. Upload these files and folders:
   - `index.html`
   - `src/`
   - `assets/`
   - `download.png`
   - `README.md`
   - `.nojekyll`
   - `.gitignore`
   - optional local runners: `start-game.cmd`, `serve.ps1`, `server.mjs`, `package.json`
4. Open repository `Settings` -> `Pages`.
5. Set source to `Deploy from a branch`.
6. Select branch `main` and folder `/root`.
7. Save. GitHub will show the public game URL after the first deploy.

If the public page only shows the repository name, `index.html` is not in the Pages root yet.

## Upload With Git

```powershell
git init
git add .
git commit -m "Initial WASD Range game"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

Then enable GitHub Pages from `Settings` -> `Pages` using `main` and `/root`.
