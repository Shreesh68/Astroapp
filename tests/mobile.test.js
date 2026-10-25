import { describe, expect, it } from 'vitest'
import { indianMobile } from '../src/lib/account'

describe('Indian mobile numbers (login)', () => {
  it.each([
    ['9876543210', '+919876543210'],
    ['98765 43210', '+919876543210'],
    ['+91 98765 43210', '+919876543210'],
    ['09876543210', '+919876543210'],
    ['6000000000', '+916000000000'],
  ])('%s → %s', (input, want) => expect(indianMobile(input)).toBe(want))

  it.each(['5876543210', '987654321', '98765432101', 'abcdefghij', ''])('rejects %s', input => expect(indianMobile(input)).toBeNull())
})
