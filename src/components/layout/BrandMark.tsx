/**
 * FloodLens mark: a lens ring framing two tide lines. Original artwork. Navy with the premium
 * treatment (v0.50): light from the top and a faint top highlight. #0069b0 flat before.
 */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="fl-mark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2d5287" />
          <stop offset="1" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="url(#fl-mark)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="5.5" fill="none" stroke="rgb(255 255 255 / 0.18)" />
      <circle cx="15" cy="15" r="9" stroke="#ffffff" strokeWidth="1.8" />
      <path d="M6.9 16.2c2.03 0 2.03-1.4 4.05-1.4s2.03 1.4 4.05 1.4 2.03-1.4 4.05-1.4 2.03 1.4 4.05 1.4" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.6 19.6c1.6 0 1.6-1.1 3.2-1.1s1.6 1.1 3.2 1.1 1.6-1.1 3.2-1.1 1.6 1.1 3.2 1.1" stroke="#9fd0f5" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21.6 21.6l4.2 4.2" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
