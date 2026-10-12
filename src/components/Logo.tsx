/** NitPick mark: a 3×3 pixel grid with one highlighted pixel made of RGB subpixels. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1d1d24" />
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2].map((c) =>
          r === 1 && c === 1 ? null : (
            <rect key={`${r}${c}`} x={6 + c * 7} y={6 + r * 7} width="5" height="5" rx="1" fill="#3a3a46" />
          ),
        ),
      )}
      <rect x="13" y="13" width="1.7" height="5" fill="#ff4d5e" />
      <rect x="14.65" y="13" width="1.7" height="5" fill="#3ddc84" />
      <rect x="16.3" y="13" width="1.7" height="5" fill="#4d8dff" />
    </svg>
  );
}
