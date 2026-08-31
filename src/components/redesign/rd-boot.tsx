import { useEffect, useRef, useState } from "react";

/** Boot sequence. The site starts as a machine warming up.
 *
 * Straight from HAN Kjøbenhavn: full commitment, not a five-second gimmick —
 * an ASCII mark and a real init log that reports the brand's actual position
 * as system state ("STOCK ... NONE", "SEASON ... NONE"). The positioning is
 * the boot log; that's the joke and the argument at once.
 *
 * Three rules keep it from becoming a toll booth:
 *   1. Skippable at any moment — click, key, or the explicit SKIP control.
 *   2. Runs once per session (sessionStorage), so it never gates a returning
 *      visitor mid-browse.
 *   3. It is only ever mounted on the homepage. Cart and checkout never boot
 *      — nothing is allowed to delay a purchase.
 */

const ASCII = String.raw`
  ▄▄▄       ███▄    █  ▒█████  ▄▄▄█████▓ ██░ ██  ▓█████  ██▀███
 ▒████▄     ██ ▀█   █ ▒██▒  ██▒▓  ██▒ ▓▒▓██░ ██▒ ▓█   ▀ ▓██ ▒ ██▒
 ▒██  ▀█▄  ▓██  ▀█ ██▒▒██░  ██▒▒ ▓██░ ▒░▒██▀▀██░ ▒███   ▓██ ░▄█ ▒
 ░██▄▄▄▄██ ▓██▒  ▐▌██▒▒██   ██░░ ▓██▓ ░ ░▓█ ░██  ▒▓█  ▄ ▒██▀▀█▄
  ▓█   ▓██▒▒██░   ▓██░░ ████▓▒░  ▒██▒ ░ ░▓█▒░██▓ ░▒████▒░██▓ ▒██▒
  ▒▒   ▓▒█░░ ▒░   ▒ ▒ ░ ▒░▒░▒░   ▒ ░░    ▒ ░░▒░▒ ░░ ▒░ ░░ ▒▓ ░▒▓░
   ▒   ▒▒ ░░ ░░   ░ ▒░  ░ ▒ ▒░     ░     ▒ ░▒░ ░  ░ ░  ░  ░▒ ░ ▒░
   ░   ▒      ░   ░ ░ ░ ░ ░ ▒    ░       ░  ░░ ░    ░     ░░   ░
       ░  ░         ░     ░ ░            ░  ░  ░    ░  ░   ░
   ██▓███   █    ██  ███▄    █  ██ ▄█▀
  ▓██░  ██▒ ██  ▓██▒ ██ ▀█   █  ██▄█▒
  ▓██░ ██▓▒▓██  ▒██░▓██  ▀█ ██▒▓███▄░
  ▒██▄█▓▒ ▒▓▓█  ░██░▓██▒  ▐▌██▒▓██ █▄
  ▒██▒ ░  ░▒▒█████▓ ▒██░   ▓██░▒██▒ █▄
  ▒▓▒░ ░  ░░▒▓▒ ▒ ▒ ░ ▒░   ▒ ▒ ▒ ▒▒ ▓▒
  ░▒ ░     ░░▒░ ░ ░ ░ ░░   ░ ▒░░ ░▒ ▒░
  ░░        ░░░ ░ ░    ░   ░ ░ ░ ░░ ░
              ░              ░ ░  ░
`;

const LINES: [string, string][] = [
  ["KERNEL", "OK"],
  ["INK / RED 032C", "LOADED"],
  ["INK / SECOND COLOUR", "NONE"],
  ["STOCK", "NONE"],
  ["SEASON", "NONE"],
  ["REPEAT", "NONE"],
  ["ORIGIN / WESTWOOD PANEL", "READ"],
  ["ORIGIN / REPO MAN", "READ"],
  ["PRESS", "COLD"],
  ["CATALOGUE", "12 JOBS"],
  ["STOREFRONT SYNC", "OK"],
];

const KEY = "ap-rd-booted";

export function RdBoot({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      // Private mode. The sequence simply runs again; nothing breaks.
    }
    onDone();
  };

  useEffect(() => {
    // Any input at all skips it. A boot screen you cannot dismiss is a
    // toll booth, not a flourish.
    const skip = () => finish();
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, { passive: true });

    const id = window.setInterval(() => {
      setN((v) => {
        if (v >= LINES.length) {
          window.clearInterval(id);
          window.setTimeout(finish, 420);
          return v;
        }
        return v + 1;
      });
    }, 165);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rd-boot" role="status" aria-live="polite" aria-label="Starting Another Punk">
      <pre className="rd-ascii" aria-hidden="true">
        {ASCII}
      </pre>
      <div className="flex flex-col gap-[3px]">
        {LINES.slice(0, n).map(([k, v]) => (
          <span key={k} className="rd-bootline">
            {k}
            <span aria-hidden="true"> {".".repeat(Math.max(2, 34 - k.length))} </span>
            <span style={{ color: v === "NONE" ? "var(--rd-red)" : "var(--rd-paper)" }}>{v}</span>
          </span>
        ))}
        <span className="rd-bootline rd-caret" />
      </div>
      <button
        type="button"
        onClick={finish}
        className="rd-label mt-8 self-start underline underline-offset-4"
      >
        Skip
      </button>
    </div>
  );
}

/** True when this session has already booted, so the homepage can skip it. */
export function hasBooted(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
