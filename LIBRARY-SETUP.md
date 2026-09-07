# Private Library setup

The public Blog keeps only the `/library` reader and authentication API. The
catalog, notes, and binary files live in the private repository
`Xiaobai1100/ebook-library`; reading formats and Office files are stored through
Git LFS.

## GitHub access token

Create a fine-grained personal access token dedicated to this reader:

1. Open GitHub Settings → Developer settings → Personal access tokens →
   Fine-grained tokens.
2. Select the `Xiaobai1100` resource owner and **Only select repositories** →
   `ebook-library`.
3. Grant only **Repository permissions → Contents: Read-only**. Metadata read
   access is added automatically. Do not grant write or administration access.
4. Save the token as `GITHUB_LIBRARY_TOKEN` in the Vercel project, for
   Production, Preview, and Development. Treat it as a secret.

The optional variables `GITHUB_LIBRARY_REPOSITORY` and `GITHUB_LIBRARY_REF`
default to `Xiaobai1100/ebook-library` and `main`.

The existing `LIBRARY_PASSWORD_HASH` and `LIBRARY_SESSION_SECRET` continue to
protect the browser-facing library. No plaintext password or GitHub token is
committed to either repository.

## Updating the collection

The local library at `D:\E-Book & Resource` is the private Git repository. Its
top-right Git action commits, rebases, and pushes both the lightweight catalog
and any new Git LFS objects. The Blog reads the latest `main` branch directly,
so there is no second publishing or object-storage upload step.

From a terminal, the equivalent flow is:

```powershell
git -C 'D:\E-Book & Resource' add -A
git -C 'D:\E-Book & Resource' commit -m 'Update library'
git -C 'D:\E-Book & Resource' pull --rebase
git -C 'D:\E-Book & Resource' push
```

The Blog API fetches the LFS pointer only after a valid library session, obtains
a short-lived Git LFS download action, and streams PDF range responses without
exposing the repository token to the browser.
