/** FloodLens mark: a lens ring framing two tide lines. Original artwork. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#0069b0" />
      <circle cx="15" cy="15" r="9" stroke="#ffffff" strokeWidth="1.8" />
      <path d="M6.9 16.2c2.03 0 2.03-1.4 4.05-1.4s2.03 1.4 4.05 1.4 2.03-1.4 4.05-1.4 2.03 1.4 4.05 1.4" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.6 19.6c1.6 0 1.6-1.1 3.2-1.1s1.6 1.1 3.2 1.1 1.6-1.1 3.2-1.1 1.6 1.1 3.2 1.1" stroke="#9fd0f5" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21.6 21.6l4.2 4.2" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
