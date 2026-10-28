import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

// Remembered preferences (unit, panel width) must not leak between tests.
afterEach(() => localStorage.clear())
