# Security incident report — malicious force-push to `main` (2026-10-19)

Prepared 2026-10-20. Read-only investigation: nothing from the repository or the payload was executed, no attacker infrastructure was contacted, no history was rewritten, nothing was pushed, and no account or remote setting was changed. Labels: **Confirmed** = directly shown by evidence; **Likely** = supported but not conclusive; **Unknown** = insufficient evidence.

## 1. Executive summary

> **Update after the cross-repository review (same day):** this is not a one-off. GitHub's activity logs show **automated force-push waves across ~20 of your 24 repositories** — each wave hitting all of them within ~1 minute — on **2026-08-13, 09-13, 10-08, 10-12, 10-16 and 10-19** (UTC), all as KevalVaghani13. Sampled wave commits rewrite config/entry files (`postcss.config.js`, `vite.config.js`, `.eslintrc.cjs`, `api.js`) with this loader (tags `A10-*33860`, `A10-**1`). A second infected working copy exists on this PC: **`Downloads/New Diamond-selector/lyradiamonds.shop`** (its `npm run dev/build/start` runs `node api.js`, which contains the loader). The compromise of your GitHub credential therefore dates from **on or before 2026-08-13** and has persisted through at least one credential rotation.

- **Confirmed:** At **2026-10-19 06:57:31 UTC (12:27:31 IST)** someone holding a valid credential for the GitHub account **KevalVaghani13** **force-pushed** `main`, replacing your clean commit `029dc46` with a look-alike commit `6f114af` that adds an obfuscated Node.js loader to `client/vite.config.js`. The repo is private, you are the only collaborator, and there are no deploy keys, webhooks, Actions workflows, apps or branch protection — so no bot or integration did it: it was a credential of your account.
- **Confirmed:** The same malware family was already in this repo on **2026-10-16** (first incident, commits `ab23158`/`4727ad8`), traced then to a downloaded project `Downloads/node-image-upload-main.zip`, and Vite **was run on this PC** while that infected config was present (recorded in `IMPLEMENTATION_REPORT.md`).
- **Likely root cause:** the 16 Oct execution on this PC installed or ran a second stage that stole GitHub credentials (and possibly more). Three days later that access was used to re-infect your newest commit by force-push. The re-infection on 19 Oct was **not** executed on this PC (see §4).
- **Current risk: HIGH.** Treat this PC and every credential reachable from your Windows account as exposed. Your GitHub account demonstrably had a working credential in attacker hands on 19 Oct, after you had already rotated credentials once.
- **Repository now:** the payload line is gone from HEAD, but two attacker-added lines remain in `client/vite.config.js` (`createRequire` scaffolding — inert alone). The payload still exists in GitHub history (`6f114af`) and in the 16 Oct history unless it was purged.

## 2. Root cause

| Hypothesis | Evidence for | Evidence against | To confirm |
|---|---|---|---|
| **A. Credential stolen from this PC (initially on/before 13 Aug; possibly refreshed after later executions), then used by attacker automation to force-push all repos (Likely)** | Same loader family both times; 16 Oct report confirms Vite ran with the infected config; loader runs arbitrary downloaded code as your user (can read Git Credential Manager / `gh` keyring tokens); force-push came 25 min after your push of `029dc46` — attacker watching the repo; committer timezone −07:00 ≠ your +05:30 | No second-stage file or process found on disk so far; Defender never detected it | GitHub **Security log** (sign-ins, token/OAuth events with IP/location around 2026-10-19 06:57 UTC); list of OAuth apps/PATs and their "last used" times |
| B. Second stage still running on this PC and pushed from here (Possible) | Your stored `gh` OAuth token (scopes `repo`, `workflow`, `delete_repo`) would allow it | Local reflog has no record of creating/pushing `6f114af`; objects for `6f114af` first appeared locally at 14:10:23 IST during a `git pull` (downloaded, not created); no suspicious Node processes now | Push source IP from GitHub (only GitHub Support can provide git-push IPs for personal accounts); endpoint scan |
| C. Untrusted IDE build ("Antigravity IDE", unsigned) stealing tokens (Unknown, red flags) | `Antigravity IDE.exe` v2.5.5 is **not code-signed**; `product.json` claims `Google.AntigravityIDE` but has placeholder `updateUrl: https://example.com` and empty license/issue URLs; installs extensions from Open VSX | No modified program files after install (26 Aug); no indicator strings found in its extensions (see §6) | Where you downloaded it from; compare with the vendor's official, signed installer |
| D. GitHub web session hijack | Not excluded | No evidence either way | GitHub Security log: sessions/sign-ins |
| E. Your own tool/automation pushed it | — | No workflows, apps, deploy keys or hooks; payload is clearly malicious and obfuscated | — |

**Conclusion:** the entry point into GitHub is **Confirmed** to be a valid credential of your account used by **automation** (multi-repo waves within seconds). **Which** credential and **from where** remains **Unknown** until you provide the GitHub Security log. The earliest wave (2026-08-13 04:57 UTC) predates the 26 Aug IDE install and the 16 Oct ZIP, so the **initial** infection is earlier and its vector is **Unknown** — candidates: an earlier downloaded/cloned project that was run, the daily scheduled task `ShopifyPOImageDownloader` (created 4 Aug, runs `node index.js` from a local copy of the `Order-Image-Download` repo, which the waves infected), or a collaborator's environment.

**Other actor:** account **RidhamGolakiya** force-pushed `Shopify-App`, `N8N-Dashboard`, `Order-Image-Download` and `Instagram-Analytics-Dashboard` at irregular times (Aug–Oct). These do not match the wave pattern and may be normal collaboration — please confirm who this is and whether their access/machine should also be reviewed.

## 3. Timeline (IST = UTC+5:30; GitHub times are UTC)

| Time (IST) | Event | Source | Label |
|---|---|---|---|
| 2026-08-04 | Scheduled task `\ShopifyPOImageDownloader` created (daily 08:00, `node index.js`) | Task Scheduler | Confirmed |
| **2026-08-13 10:27–10:28** | **First observed force-push wave** (~13 repos, 04:57–04:58 UTC); `postcss.config.js` rewritten with loader fragments | GitHub activity API + commit API | **Confirmed** |
| 2026-09-13 07:52; 10-08 10:31; 10-12 16:03; 10-16 16:39 | Further waves (04:57/02:22/05:01/10:33/11:09 UTC) across ~6–18 repos | GitHub activity API | Confirmed |
| 2026-10-16 | Same loader found in `vite.config.js`, from downloaded `node-image-upload-main.zip`; Vite run on this PC while infected; history rewritten locally | `IMPLEMENTATION_REPORT.md` | Confirmed (as recorded then) |
| 2026-10-16 09:22 | Extension `meta.pyrefly` installed from Open VSX | extension folder timestamp | Confirmed (relevance Unknown) |
| 2026-10-19 10:07:20 | Local commit `42a1f3a`; pushed 10:07:26 | local reflog, GitHub activity | Confirmed |
| 2026-10-19 12:01:54 | Local commit `029dc46` (clean); pushed **12:02:00** | local reflog, GitHub activity `push 42a1f3a→029dc46` | Confirmed |
| 2026-10-19 **12:27:31** | **`force_push` 029dc46 → 6f114af**, actor KevalVaghani13 | GitHub repository activity API | **Confirmed** |
| — | `6f114af`: same author/date as `029dc46`, committer date same instant but zone **−07:00**; parent `42a1f3a` | commit object | Confirmed |
| 2026-10-19 13:05 | Defender removed an adware bundler (FileZilla "sponsored" installer) — unrelated PUA | Defender history | Confirmed |
| 2026-10-19 13:25:41 | Commit `3be5168` "security: remove injected malware" via GitHub web as KevalVaghani13 (removes payload line only) | commit + activity `push 6f114af→3be5168` | Confirmed (please confirm this was you) |
| 2026-10-19 14:10:23 | Local `git pull --tags origin main` → **forced-update** of `origin/main` 029dc46→3be5168; `6f114af` objects first written to disk | remote reflog, object timestamps | Confirmed |
| 2026-10-19 15:17:00 | Local merge `b699c53` (takes the cleaned `3be5168` file); pushed 16:03:24 | reflog, activity | Confirmed |
| 2026-10-20 09:52:44 | Local commit `0b38711`; pushed 09:52:46 | reflog, activity | Confirmed — scanned clean |

## 4. Malware analysis (static only — never executed)

**File:** `client/vite.config.js` in `6f114af` (blob `6f90ce4`). Two additions:
1. `import { createRequire } from 'module'; const require = createRequire(import.meta.url);` — gives the payload `require()` inside an ES-module config. **Still present in HEAD.**
2. After `});`, ~500 spaces then (hidden off-screen): `global.i = 'A10-*33860'; …(function(){ var a=[<17,834-char base64 array>].join(''); eval(atob(a)); })();`

**Decoded first stage (Confirmed behaviour):**
- `require`s `node:http`, `node:https`, `node:zlib`, `node:child_process`.
- Finds the latest Ethereum transaction **sent by `0x1eEf0849EDa15d87f64e51C73C8442Cf3c8bCEF3`** using public RPCs (`1rpc.io`, `eth.drpc.org`, `ethereum-rpc.publicnode.com`, `eth-mainnet.public.blastapi.io`, plus `ETH_RPC_URL` if set) and `eth.blockscout.com`. The transaction's *to* address encodes two IPv4 addresses (C2).
- Downloads `http://<ip1>:443/0x/cls` and `http://<ip1>:443/0x/ls` (plain HTTP on port 443), XOR-decrypts with keys `q4FZkxX{!h,Sr3=@` and `y-p_>d$0B&@^1aQk`, then **`eval`s** one in-process and **spawns `node -e <code>` detached, hidden (`windowsHide`), `unref()`** so it keeps running after the build ends. Sends header `Sec-V: A10-*33860` (campaign/victim tag). Sets globals `_V`, `_H`, `_H2`, `_t_s`, `_t_u` for the next stage.

**Trigger:** anything that loads `client/vite.config.js` — `npm run dev`, `npm run build` (both Vite builds load it; the widget build uses `vite.widget.config.js`, which was not infected), `npm test` / `vitest`. **Not** `npm install` (no lifecycle script involved) and not the server.

**Capabilities (Possible, via the downloaded stages):** arbitrary code as your Windows user — read environment variables, `.env` files, source, browser data, Git Credential Manager / `gh` tokens, SSH keys, files such as `Desktop\Google All Tools Credentials.json`; modify files and repos; persist; exfiltrate. The second-stage code itself is not in the repo and was not retrieved (by design — no contact with C2).

**Execution on this PC:**
- 16 Oct copy: **Likely executed** (Vite ran while infected, per the 16 Oct report).
- 19 Oct copy: **Likely not executed here** — `6f114af` was never checked out (no reflog entry), the 15:17 merge used the cleaned file, current tree is clean.
- Currently running payload processes: **none found** (2026-10-20; only `chrome-devtools-mcp` Node processes started by your IDE).

## 5. Attack path (Likely)

Downloaded project (`node-image-upload-main.zip`) → its loader ran on this PC (16 Oct) → second stage obtained a GitHub credential (and possibly other secrets) → on 19 Oct the attacker (or automation) took your newest commit, rebuilt it with the loader added (preserving your name/email/date; timezone −07:00), and force-pushed it over `main` — possible because `main` had no protection — so that the next `npm run dev/build` by you or anyone cloning would re-run the loader.

## 6. Scope

| Item | Status |
|---|---|
| Current working tree / HEAD (`0b38711`) | No payload; **attacker `createRequire` lines remain** in `client/vite.config.js` — Confirmed |
| Local refs | Only `main`, `origin/main`; no tags, no stashes — Confirmed |
| History (all commits) | Payload markers only in `6f114af` (introduced) and `3be5168` (removed); other long lines are legitimate text — Confirmed |
| GitHub `main` history | Contains `6f114af` (and the 16 Oct infected commits if they were never purged from GitHub) — Confirmed for `6f114af` |
| GitHub integrations | No collaborators besides you, no deploy keys, webhooks, workflows, runs, rulesets, branch protection — Confirmed |
| Git config / hooks / templates / npm registry / PowerShell profiles / Run keys / Startup | Clean — Confirmed |
| Scheduled task `\ShopifyPOImageDownloader` | Runs `node index.js` daily from `Desktop\Image Download` (folder now missing → fails since). Its repo `Order-Image-Download` was infected by the waves, so while the folder existed this task could have run the loader **automatically every morning** — Possible persistence path. Disable it |
| **Other repos on GitHub** | ~20 repos force-pushed by the waves (list in appendix); 19 Oct wave commits contain the loader — Confirmed for sampled repos |
| **`Downloads/New Diamond-selector/lyradiamonds.shop`** | **Working files infected now:** `postcss.config.js` (tag `A10-*33860`) and `api.js` (`A10-**1`, plus `createRequire`); `package.json` `dev`/`build`/`start` run `node api.js` (that wiring dates from the 7–8 Oct commits). Arrived via the 17 Oct 16:31 merge of GitHub's rewritten history — Confirmed. **Do not run npm scripts in this folder** |
| Other local clones (`Desktop/EMB`, `Shopify APP`, `employee-kpi-crm`, `Multiple-Platform-Analytics`) | Current files clean (profile scan) — Confirmed; their GitHub copies may be infected |
| IDE "Antigravity IDE" 2.5.5 | **Unsigned**, placeholder update URL — untrusted; no post-install changes found |
| Defender | Never detected the loader; no full scan ever run |
| User-profile scan for indicators | See addendum at the end of this report |
| Credentials | **Exposure:** everything readable by your Windows user (GitHub `gh`/GCM tokens with `repo`,`workflow`,`delete_repo`; `server/.env` secrets: `DATABASE_URL`, `JWT_SECRET`, `ENC_KEY`, demo/admin passwords; browser-saved logins; `Google All Tools Credentials.json`; SSH keys if any). **Confirmed misuse:** a GitHub credential (force-push). Others: Unknown |

## 7. Recovery plan (all require your action/approval — nothing below was done)

**Now (containment):**
0. **Do not run** `npm`/`node` in `lyradiamonds.shop` or in any freshly pulled copy of your repos. Disable the scheduled task `ShopifyPOImageDownloader` (Task Scheduler → right-click → Disable).
1. From a **different, clean device**: change your GitHub password, sign out all sessions (Settings → Sessions), enable/verify 2FA (authenticator app or passkey).
2. GitHub Settings → Applications: revoke **GitHub CLI**, **Git Credential Manager** and any OAuth app you don't need; Developer settings → delete all personal access tokens; SSH/GPG keys → delete all.
3. Export the **Security log** (Settings → Security log, filter around 2026-10-19 06:30–07:30 UTC) and send it to me — this decides hypotheses A/B/D.
4. Disconnect this PC from sensitive work until scanned: run **Microsoft Defender Offline scan** and a full scan; consider a second scanner. If anything is found, or you cannot rule out persistence, **back up data (not executables) and reinstall Windows**.
5. Uninstall the unsigned "Antigravity IDE" and only reinstall from the vendor's official, signed source.

**Next (secrets):**
6. Rotate everything that was readable on this PC: `JWT_SECRET` (signs everyone out), `ENC_KEY` (re-enter webhook/SMTP secrets after), database passwords, SMTP credentials, Shopify tokens, the Google credentials file (revoke the service account/OAuth client it contains), browser-saved passwords for important sites, any crypto wallets on this PC (move funds from a clean device).

**Repository:**
7. Protect `main` **in every repository**: block force pushes and deletions; require pull requests (Settings → Branches / Rulesets). Until credentials are rotated, the attacker can push to all your repos.
7b. For **each** affected repo, restore the last known-good commit (the `before` SHA of the first wave in the appendix list) after review, rather than trusting current `main`. Warn anyone who cloned/forked them since 2026-08-13.
8. Remove the two attacker `createRequire` lines from `client/vite.config.js` (I can do this on your approval — it's a 3-line working-tree change, no history rewrite).
9. Decide on history: either keep history (payload commits remain but are inert unless checked out and built) and add a warning, or purge `6f114af` (and the 16 Oct commits if still on GitHub) by rewriting history and force-pushing **after** steps 1–7. I will not force-push without your explicit approval.
10. Verified clean revision: HEAD `0b38711` minus the two lines in step 8. Its ancestry still contains `6f114af` (via merge `b699c53`), so a purge (step 9) is needed if you want no copy on GitHub.

## 8. Application verification

The application fixes (allowlist, Reports, Clear History, greeting, assignee, email diagnostics) were verified in the previous session on throwaway databases: backend 75/75, frontend 59/59 tests, production build, and browser checks. In this session I did **not** re-run builds or tests, because (a) the machine itself is likely compromised and (b) `client/vite.config.js` still contains attacker scaffolding. Re-verify on a clean machine/CI runner after step 8.

## 9. What I need from you

- GitHub **Security log** export (and the list of Authorized OAuth Apps / tokens with "last used").
- Whether **you** made commit `3be5168` on GitHub at 13:25 IST.
- Where you downloaded "Antigravity IDE" and `node-image-upload-main.zip` (link/sender), and whether you ran any other downloaded project.
- Results of a Defender Offline scan.

## 10. Evidence appendix

Preserved (not in the repo) under the session scratchpad `evidence/` folder: full `git bundle` of all refs, raw commit objects, reflogs, `FETCH_HEAD`/`ORIG_HEAD`/`packed-refs`, GitHub activity and event JSON, the payload (saved with `.DO-NOT-RUN` names), and its decoded first stage.

| Item | Value |
|---|---|
| Malicious commit | `6f114afee5b0cb154f0344e383fad91f5ba2a9ec` (parent `42a1f3a19821b04c015bd09f12eabe3ba3b7860a`) |
| Replaced clean commit | `029dc4695e25854d4fbabcde40faf75a502c55b7` |
| Removal commit | `3be51680e9714688efcb8909fe51a9b9c4bbcb04` |
| Merge | `b699c53237f3b7f9bf13579b9aef9cd9364fb045`; current HEAD `0b3871145a31ad4a2938e74daf9c9487b84446dc` |
| Infected blob `client/vite.config.js` | `6f90ce4ed685841fb83e6061b9a8e5e81fd8366e` (file SHA-256 `ee559c62e017c6e588ec314a7150232d1637449edc9d183203d57dd8d15729b9`) |
| Clean blob (029dc46) / current blob | `ca3b8ea8ae5fe3ba6c4419ff44839e694dc2c948` / `923b5984ba20abb3af6a5874ae12db88e087df78` |
| Payload line SHA-256 | `7d88a28d607f76b6369fc03d059b4a81335e67bbcc9170743c38e6b68f6013e5` |
| Decoded stage-1 SHA-256 | `e87863a635f2701e03861d1c75fe3fe35c5fbb1c768cea450dbbe69e38c38737` |
| Indicators | tag `A10-*33860`; wallet `0x1eEf0849EDa15d87f64e51C73C8442Cf3c8bCEF3`; paths `/0x/cls`, `/0x/ls` over HTTP :443; XOR keys above; detached `node -e` children |
| GitHub activity (UTC) | `06:32:00 push 42a1f3a→029dc46`; **`06:57:31 force_push 029dc46→6f114af`**; `07:55:41 push 6f114af→3be5168`; `10:33:24 push 3be5168→b699c53`; `2026-10-20 04:22:46 push b699c53→0b38711` — all actor KevalVaghani13 |
| Local remote-tracking reflog | `1792399223 (2026-10-19 14:10:23 IST) pull --tags origin main: forced-update 029dc46→3be5168` |


## Addendum — cross-repository evidence (GitHub activity API, read-only)

Force-push waves (UTC, actor KevalVaghani13 unless noted), first and last per repo shown in the raw JSON; repos hit in the **2026-10-19 06:57** wave: Import-export-website-template, automation-agency, Bitrix-Analytics-Dashboard, CM, Daily-Routine-Enhancer, emb, Lily-Ann-Gems, Instagram-Analytics-Dashboard, LiveChat, lyradimaonds.shop, N8N-Dashboard, Order-Image-Download, Plant-care, Rental-Cloth-Platform, routine-flow-harmonizer-18, Shopify-App, texaflow-glow-page, Texaflow-latest. Earlier waves: 2026-08-13 04:57–04:58, 2026-09-13 02:22, 2026-10-08 05:01–05:02, 2026-10-12 10:33–10:35, 2026-10-16 11:09 (also hit youtube-video-download, Small-Project, Image-Scraper, Ai-Resume-Parser-Analyzer on some waves).

Sampled payload confirmation (commit API, files changed by the pushed commit containing loader markers): Texaflow-latest `13406cf` (api.js, postcss.config.js), emb `a6d8089` (api.js, backend/api.js, frontend/api.js, frontend/vite.config.js, vite.config.js), Shopify-App `4822365` (.eslintrc.cjs, api.js), lyradimaonds.shop `15d10f7` (api.js, postcss.config.js); 2026-08-13 wave: Texaflow-latest `5701be0`, Plant-care `592fbcc`, N8N-Dashboard `691cc79` (postcss.config.js).

Local infected copy: `Downloads/New Diamond-selector/lyradiamonds.shop` — `postcss.config.js` SHA-256 prefix `01e1b5562cbc9d0d`, `api.js` `059795523a7ce204` (modified 2026-10-17 16:31:01 IST by the merge `d4218a4`). Its remote-history twin commit `fe59158` (committer zone −07:00, force-pushed 2026-10-16 11:09:29 UTC) mirrors LiveChat's `6f114af`.

Profile-wide indicator scan (all of `C:\Users\keval`, including AppData, node_modules, npm cache): hits only in those two lyradiamonds files plus AI-assistant transcripts that quote the indicators. No second-stage files found by indicator. No suspicious running processes. Defender: only an unrelated PUA (FileZilla bundler, 19 Oct); no full scan ever run.
