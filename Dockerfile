# Pharmacist Wrapped Portal.
#
# This app renders video server-side, which means it needs a long-running
# process, a writable disk and a real Chromium. That rules out serverless hosts
# (Netlify, Vercel functions) — see README "Deploying". Any container host works:
# Render, Railway, Fly.io, or a plain VM.

FROM node:22-bookworm-slim

# Chromium plus the fonts Remotion needs to draw Devanagari. Installing the
# browser here rather than letting Remotion download its own headless shell on
# first render keeps a pharmacist from waiting on a 150MB download.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation \
      fonts-noto-core \
      fonts-noto-color-emoji \
      ca-certificates \
      dumb-init \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Dependencies first, so a source-only change does not reinstall them.
COPY package.json package-lock.json ./

# Dev dependencies are kept deliberately: the render pipeline calls Remotion's
# bundler at runtime, which compiles remotion/*.tsx and needs the TypeScript
# toolchain present. `--omit=dev` produces an image that builds and then fails
# on the first render.
RUN npm ci

COPY . .

RUN npm run build

# Submissions, photos and finished films. Mount a volume here on any host that
# offers one — a container restart otherwise takes every film with it.
VOLUME ["/app/.data"]

EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

# dumb-init reaps the Chromium processes Remotion spawns; without an init the
# container accumulates zombies across renders.
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
