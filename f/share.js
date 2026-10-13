// Opens a Desktop shared folder entirely in this tab.
//
// The link is https://arkive.tech/f/#<id>.<key>. The fragment never
// leaves the browser, so neither this site nor anyone watching it learns
// which folder is being opened; the share function sees only the id and
// returns ciphertext it cannot read. The format matches the app's
// FolderShareSealing: AES-256-GCM, 12-byte nonce ‖ ciphertext ‖ tag,
// fixed associated data, JSON inside.
//
// Nothing from the folder is ever inserted as HTML: every value goes in
// through textContent or a checked attribute.

"use strict";

const BACKENDS = {
  prod: "https://ddzcgaykvggbyvxlmawn.supabase.co",
  dev: "https://cparusgxeqqqqkoygesi.supabase.co",
};
const AAD = new TextEncoder().encode("Desktop folder share v1");
const SUPPORTED_VERSION = 1;
const SOURCE_NAMES = {
  instagram: "Instagram", tiktok: "TikTok", x: "X", youtube: "YouTube",
  reddit: "Reddit", pinterest: "Pinterest", threads: "Threads", web: "Web",
};

const $ = (id) => document.getElementById(id);

function fail(message) {
  $("status").textContent = message;
  $("folder").hidden = true;
}

function parseFragment() {
  const fragment = location.hash.slice(1);
  const dot = fragment.indexOf(".");
  if (dot < 0) return null;
  const id = fragment.slice(0, dot);
  const key = fragment.slice(dot + 1);
  if (!/^[A-Za-z0-9]{10}$/.test(id) || !/^[A-Za-z0-9_-]{43}$/.test(key)) return null;
  return { id, key };
}

function base64UrlToBytes(text) {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function decrypt(sealed, keyText) {
  const key = await crypto.subtle.importKey("raw", base64UrlToBytes(keyText), "AES-GCM", false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: sealed.slice(0, 12), additionalData: AAD, tagLength: 128 },
    key,
    sealed.slice(12),
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function safeLink(text) {
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function hostOf(text) {
  try { return new URL(text).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function folderGlyph() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M3 6.5A2.5 2.5 0 0 1 5.5 4h4.2c.6 0 1.2.3 1.6.7l1.3 1.3h5.9A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z");
  svg.append(path);
  return svg;
}

function card(item) {
  const href = safeLink(item.url);
  const element = document.createElement(href ? "a" : "div");
  element.className = "card";
  if (href) {
    element.href = href;
    element.target = "_blank";
    element.rel = "noopener noreferrer";
  }

  if (typeof item.thumbnail === "string" && /^[A-Za-z0-9+/=]+$/.test(item.thumbnail)) {
    const image = document.createElement("img");
    image.src = `data:image/jpeg;base64,${item.thumbnail}`;
    image.alt = "";
    image.loading = "lazy";
    if (item.thumbnailWidth > 0 && item.thumbnailHeight > 0) {
      image.width = item.thumbnailWidth;
      image.height = item.thumbnailHeight;
    }
    element.append(image);
  }

  const body = document.createElement("div");
  body.className = "body";
  const source = document.createElement("div");
  source.className = "source";
  source.textContent = (item.source !== "web" && SOURCE_NAMES[item.source]) || hostOf(item.url) || "Link";
  body.append(source);

  const text = item.title || item.caption;
  if (text) {
    const title = document.createElement("p");
    title.className = "title";
    title.textContent = text;
    body.append(title);
  }
  const creator = item.creatorHandle ? `@${item.creatorHandle.replace(/^@/, "")}` : item.creatorName;
  if (creator) {
    const line = document.createElement("p");
    line.className = "creator";
    line.textContent = creator;
    body.append(line);
  }
  element.append(body);
  return element;
}

function render(folder) {
  const glyph = $("glyph");
  if (folder.emoji) glyph.textContent = folder.emoji;
  else glyph.append(folderGlyph());

  $("name").textContent = folder.name;
  const count = folder.items.length;
  const saves = count === 1 ? "1 save" : `${count} saves`;
  $("meta").textContent = folder.sender ? `From ${folder.sender} · ${saves}` : saves;
  document.title = `${folder.name} · Desktop`;

  const grid = $("grid");
  for (const item of folder.items) grid.append(card(item));

  if (folder.personalItemsLeftOut > 0) {
    const note = $("note");
    note.hidden = false;
    note.textContent = folder.personalItemsLeftOut === 1
      ? "1 personal photo or file stayed on the sender's phone."
      : `${folder.personalItemsLeftOut} personal photos and files stayed on the sender's phone.`;
  }

  $("status").textContent = "";
  $("folder").hidden = false;
}

async function open() {
  const share = parseFragment();
  if (!share) return fail("This link is incomplete. Ask for it to be sent again, and make sure the whole link is copied.");
  if (!crypto?.subtle) return fail("This browser can't open shared folders. Try Safari or Chrome.");

  const backend = new URLSearchParams(location.search).has("dev") ? BACKENDS.dev : BACKENDS.prod;
  let response;
  try {
    response = await fetch(`${backend}/functions/v1/share?id=${share.id}`, { credentials: "omit", referrerPolicy: "no-referrer" });
  } catch {
    return fail("Couldn't load this folder. Check your connection and try again.");
  }
  if (response.status === 404) return fail("This link has expired. Shared folder links last 30 days, so ask for a new one.");
  if (!response.ok) return fail("Couldn't load this folder. Try again in a moment.");

  let folder;
  try {
    folder = await decrypt(new Uint8Array(await response.arrayBuffer()), share.key);
  } catch {
    return fail("This link is incomplete. Ask for it to be sent again, and make sure the whole link is copied.");
  }
  if (folder?.version !== SUPPORTED_VERSION) return fail("This folder was shared from a newer version of Desktop. Get the latest Desktop to open it.");
  if (typeof folder.name !== "string" || !Array.isArray(folder.items)) return fail("This folder couldn't be read.");
  render(folder);
}

open();
addEventListener("hashchange", () => location.reload());
