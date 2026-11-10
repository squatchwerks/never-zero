#!/usr/bin/env python3
"""tools/make-icons.py — draws the Never Zero app icons into icons/.

Not part of the app (the app has no build step). It's a one-off helper:
run it again after changing the colours or the orb below.

    python3 tools/make-icons.py

Uses only Python's standard library, so there is nothing to install.
"""
import math
import os
import struct
import zlib

BG = (5, 7, 15)          # --bg
CYAN = (34, 211, 238)    # --cyan
VIOLET = (139, 123, 255) # --violet
CORAL = (255, 107, 139)  # --coral

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def smoothstep(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def pixel(x, y):
    """Colour at a point. x, y run from -1 to 1 across the icon."""
    d = math.hypot(x, y)
    R = 0.56  # orb radius; inside the 80% "safe zone" Android uses for maskable icons

    # background: dark, with a faint violet wash at the top
    col = mix(BG, (20, 16, 52), max(0.0, 0.35 - y * 0.35) * 0.6)

    # halo around the orb
    halo = math.exp(-max(d - R, 0.0) * 5.5) * 0.55
    col = mix(col, mix(CYAN, VIOLET, 0.5), halo * 0.6)

    if d < R + 0.01:
        # treat the disc as a sphere: work out the surface normal at this point
        z = math.sqrt(max(R * R - d * d, 0.0))
        nx, ny, nz = x / R, y / R, z / R

        # colour sweeps cyan -> violet -> coral from top-left to bottom-right
        t = (x + y) / (2 * R) * 0.5 + 0.5
        base = mix(CYAN, VIOLET, smoothstep(0.15, 0.6, t))
        base = mix(base, CORAL, smoothstep(0.6, 1.0, t) * 0.8)

        # lighting from the top-left
        lx, ly, lz = -0.45, -0.6, 0.65
        ln = math.sqrt(lx * lx + ly * ly + lz * lz)
        lx, ly, lz = lx / ln, ly / ln, lz / ln
        dif = max(nx * lx + ny * ly + nz * lz, 0.0)
        rz = 2 * (nx * lx + ny * ly + nz * lz) * nz - lz  # reflection, z part
        spec = max(rz, 0.0) ** 40
        rim = (1 - nz) ** 2.2

        shaded = tuple(
            min(255.0, base[i] * (0.25 + 0.95 * dif) + rim * mix(CYAN, VIOLET, 0.5)[i] * 0.7 + spec * 255 * 0.6)
            for i in range(3)
        )
        edge = smoothstep(R + 0.006, R - 0.006, d)  # anti-aliased edge
        col = mix(col, shaded, edge)

    return tuple(int(max(0, min(255, round(c)))) for c in col)


def write_png(path, size):
    rows = []
    for py in range(size):
        row = bytearray([0])  # PNG filter byte: none
        for px in range(size):
            x = (px + 0.5) / size * 2 - 1
            y = (py + 0.5) / size * 2 - 1
            row.extend(pixel(x, y))
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(kind, data):
        c = struct.pack(">I", len(data)) + kind + data
        return c + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))  # 8-bit RGB
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print("wrote", os.path.relpath(path))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    write_png(os.path.join(OUT, "icon-192.png"), 192)
    write_png(os.path.join(OUT, "icon-512.png"), 512)
    write_png(os.path.join(OUT, "apple-touch-icon.png"), 180)  # iPhone home screen size
