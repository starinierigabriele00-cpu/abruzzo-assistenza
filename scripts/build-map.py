#!/usr/bin/env python3
"""Reproduce the local SVG from documented ISTAT files; never runs during deploy."""
import argparse
import hashlib
import json
import math
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT = 560, 460
SOURCES = {
    'regions': '97e9dc4c8ddb83e1d32c9f75f2007f7410f233e465cb529c6f8cf6f5ac488b0f',
    'provinces': '08db9b436f1cee666a8c789084d2857e1444543b89b2129d3c1d9f1c2efdee66',
}


def load(path, kind):
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != SOURCES[kind]:
        raise ValueError(f'{kind}: source changed; verify its provenance before updating the map')
    return json.loads(data)['features']


def rings(geometry):
    polygons = [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']
    return [ring for polygon in polygons for ring in polygon]


def mercator(point):
    lon, lat = point[:2]
    return math.radians(lon), math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def simplify(points, tolerance):
    """RDP error is measured in SVG pixels, not geographical degrees."""
    if len(points) < 3:
        return points
    ax, ay = points[0]
    bx, by = points[-1]
    dx, dy = bx - ax, by - ay
    length = dx * dx + dy * dy
    distances = []
    for x, y in points[1:-1]:
        t = max(0, min(1, ((x - ax) * dx + (y - ay) * dy) / length)) if length else 0
        distances.append(math.hypot(x - ax - t * dx, y - ay - t * dy))
    distance = max(distances, default=0)
    if distance <= tolerance:
        return [points[0], points[-1]]
    split = distances.index(distance) + 1
    return simplify(points[:split + 1], tolerance)[:-1] + simplify(points[split:], tolerance)


def clip(points):
    """Visible polygon centroid keeps neighboring region labels in the actual land area."""
    for axis, edge, sign in [(0, 0, 1), (0, WIDTH, -1), (1, 0, 1), (1, HEIGHT, -1)]:
        clipped = []
        if not points:
            break
        start = points[-1]
        for end in points:
            inside_start = sign * (start[axis] - edge) >= 0
            inside_end = sign * (end[axis] - edge) >= 0
            if inside_start != inside_end:
                ratio = (edge - start[axis]) / (end[axis] - start[axis])
                clipped.append(tuple(start[i] + ratio * (end[i] - start[i]) for i in (0, 1)))
            if inside_end:
                clipped.append(end)
            start = end
        points = clipped
    return points


def centroid(points):
    pairs = list(zip(points, points[1:] + points[:1]))
    cross = [a[0] * b[1] - b[0] * a[1] for a, b in pairs]
    area = sum(cross)
    if abs(area) < 2000:
        return None
    return tuple(sum((a[i] + b[i]) * c for (a, b), c in zip(pairs, cross)) / (3 * area) for i in (0, 1))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--regions', required=True, type=Path)
    parser.add_argument('--provinces', required=True, type=Path)
    args = parser.parse_args()
    regions = load(args.regions, 'regions')
    provinces = load(args.provinces, 'provinces')
    abruzzo = next(f for f in regions if f['properties']['reg_istat_code'] == '13')
    border = [mercator(p) for p in rings(abruzzo['geometry'])[0]]
    west, east = min(p[0] for p in border), max(p[0] for p in border)
    south, north = min(p[1] for p in border), max(p[1] for p in border)
    scale = min(390 / (east - west), 350 / (north - south))

    def project(point):
        x, y = mercator(point)
        return 70 + (x - west) * scale, 50 + (north - y) * scale

    def path(feature, crop=False):
        parts = []
        for ring in rings(feature['geometry']):
            points = [project(p) for p in ring]
            if crop:
                points = clip(points)
            if len(points) >= 3:
                parts.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in simplify(points, 0.18)) + 'Z')
        return ' '.join(parts)

    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 460" role="img" aria-labelledby="title desc">',
        '<title id="title">Abruzzo: partenze da Sulmona e Pescara</title>',
        '<desc id="desc">Confine regionale, province, costa adriatica e regioni confinanti. '
        'Sulmona si trova nell’entroterra, Pescara sulla costa. I punti indicano i centri urbani, non le sedi.</desc>',
        '<metadata>Confini ISTAT 2026, geojson-italy, CC BY 4.0. '
        'https://github.com/guglielmo/geojson-italy. Web Mercator, RDP 0.18 px. '
        'Coordinate GeoNames, CC BY 4.0: Sulmona 42.04945,13.92578; Pescara 42.45840,14.20283. '
        'Sorgenti e SHA-256 documentati in assets/SOURCES.md.</metadata>',
        '<style>text{font-family:Arial,sans-serif}</style>',
        '<defs><path id="region-boundary" d="' + path(abruzzo) + '"/>'
        '<clipPath id="region-clip"><use href="#region-boundary"/></clipPath></defs>',
        '<rect width="560" height="460" fill="#e5f0f2"/>',
        '<g fill="#edf0eb" stroke="#b7c6c2" stroke-width="1" stroke-linejoin="round" fill-rule="evenodd">',
    ]
    labels = []
    for region in regions:
        if region['properties']['reg_istat_code'] == '13':
            continue
        projected = [project(p) for p in rings(region['geometry'])[0]]
        visible = clip(projected)
        if not visible:
            continue
        svg.append('<path d="' + path(region, crop=True) + '"/>')
        center = centroid(visible)
        if center and 26 < center[0] < WIDTH - 40 and 18 < center[1] < HEIGHT - 18:
            labels.append(f'<text x="{center[0]:.1f}" y="{center[1]:.1f}" text-anchor="middle" '
                          f'fill="#52665e" font-size="18">{escape(region["properties"]["reg_name"])}</text>')
    svg += ['</g>', '<use href="#region-boundary" fill="#c8ddda"/>',
            '<g clip-path="url(#region-clip)" fill="none" stroke="#97b6b2" stroke-width="1" stroke-linejoin="round">']
    for province in provinces:
        if province['properties']['reg_istat_code'] == '13':
            svg.append('<path d="' + path(province) + '"/>')
    svg += ['</g>', '<use href="#region-boundary" fill="none" stroke="#337b80" stroke-width="2" stroke-linejoin="round"/>']
    svg += labels
    svg += ['<text x="205" y="205" fill="#355c58" font-size="23" letter-spacing="2" text-anchor="middle">ABRUZZO</text>',
            '<text x="452" y="95" fill="#496d78" font-size="18" text-anchor="middle"><tspan x="452">Mare</tspan><tspan x="452" dy="24">Adriatico</tspan></text>']
    for name, lat, lon in [('Sulmona', 42.04945, 13.92578), ('Pescara', 42.45840, 14.20283)]:
        x, y = project((lon, lat))
        svg += [f'<circle cx="{x:.1f}" cy="{y:.1f}" r="10" fill="#176373" stroke="#fff" stroke-width="3"/>',
                f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3" fill="#fff"/>',
                f'<text x="{x + 18:.1f}" y="{y + 7:.1f}" fill="#172d35" font-size="24" font-weight="600" '
                f'stroke="#eef5f3" stroke-width="4" stroke-linejoin="round" paint-order="stroke">{name}</text>']
    # True 40 km scale at the map's central latitude, accounting for Mercator scale.
    distance = 40000 / (6378137 * math.cos(math.radians(42.3))) * scale
    svg += [f'<path d="M28,415v6h{distance:.1f}v-6" fill="none" stroke="#49655f" stroke-width="1.5"/>',
            '<text x="28" y="442" fill="#49655f" font-size="16">40 km</text>', '</svg>']
    target = ROOT / 'assets/abruzzo-map.svg'
    target.write_text('\n'.join(svg) + '\n')
    print(f'Built {target.name}: {target.stat().st_size:,} bytes; verified sources, no external assets')


if __name__ == '__main__':
    main()
