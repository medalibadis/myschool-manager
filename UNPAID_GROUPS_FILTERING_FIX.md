# Unpaid Groups Filtering Fix

## Issue Identified

**Problem**: When a student pays the full discounted amount for a group, the group still appears in the unpaid groups list instead of being removed.

**Example Scenario**:
- Original Group Fee: 6000
- Discount Applied: 16.7%
- Discounted Amount: 4999.80
- Payment Made: 4999.80
- Expected Result: Group should disappear from unpaid list
- Actual Result: Group still appears in unpaid list ❌

## Root Cause Analysis

The issue was **floating-point precision** in the remaining amount calculation:

### Before Fix (Incorrect Logic):
1. **Line 2258**: `const remainingAmount = Math.max(0, discountedGroupFee - amountPaid);`
2. **Line 427**: `const shouldInclude = gb.remainingAmount > 0;`
3. **Result**: Floating-point precision issues caused `remainingAmount` to be slightly above 0 (e.g., 0.0000000001)

### After Fix (Correct Logic):
1. **Line 2258**: `const remainingAmount = Math.max(0, discountedGroupFee - amountPaid);`
2. **Line 2259**: `const roundedRemainingAmount = Math.round(remainingAmount * 100) / 100;`
3. **Line 427**: `const shouldInclude = gb.remainingAmount > tolerance;` (tolerance = 0.01)
4. **Result**: Groups with remaining amounts ≤ 1 cent are considered fully paid

## Code Changes Made

### File: `src/lib/supabase-service.ts`

**Added floating-point precision handling**:
```typescript
// Calculate remaining amount for this group
const remainingAmount = Math.max(0, discountedGroupFee - amountPaid);

// Round to 2 decimal places to avoid floating-point precision issues
const roundedRemainingAmount = Math.round(remainingAmount * 100) / 100;

// Use rounded remaining amount in group balances
groupBalances.push({
  // ... other fields
  remainingAmount: roundedRemainingAmount,
  // ... other fields
});
```

### File: `src/app/payments/page.tsx`

**Added tolerance for floating-point comparison**:
```typescript
const list = balance.groupBalances
  .filter(gb => {
    // Add small tolerance for floating-point precision issues
    const tolerance = 0.01; // 1 cent tolerance
    const shouldInclude = gb.remainingAmount > tolerance;
    return shouldInclude;
  })
```

### File: `src/utils/paymentUtils.ts`

**Updated all filtering functions with tolerance**:
```typescript
static formatGroupsWithDebts(groupBalances: GroupBalance[]) {
  const tolerance = 0.01; // 1 cent tolerance for floating-point precision
  return groupBalances
    .filter(gb => gb.remainingAmount > tolerance)
    // ... rest of function
}
```

## Expected Results

After the fix:
- ✅ Student pays exact discounted amount → Group disappears from unpaid list
- ✅ No more floating-point precision issues
- ✅ Groups with ≤ 1 cent remaining are considered fully paid
- ✅ Unpaid groups list accurately reflects payment status
- ✅ Discount calculations work correctly

## Testing Scenarios

1. **Full Payment**: Student pays exact discounted amount → Group removed from unpaid list
2. **Partial Payment**: Student pays less than discounted amount → Group stays in unpaid list
3. **Overpayment**: Student pays more than discounted amount → Group removed from unpaid list
4. **Floating-Point Edge Cases**: Small precision differences are handled correctly
5. **Multiple Groups**: All groups are filtered correctly based on payment status

## Prevention

This fix ensures that:
- ✅ Floating-point precision issues are eliminated
- ✅ Groups are properly removed when fully paid
- ✅ Small rounding differences don't affect payment status
- ✅ All payment scenarios work correctly
- ✅ Unpaid groups list is always accurate

## Files Modified

- `src/lib/supabase-service.ts` - Added floating-point precision handling
- `src/app/payments/page.tsx` - Added tolerance for unpaid groups filtering
- `src/utils/paymentUtils.ts` - Updated all filtering functions with tolerance
- `test-discount-payment-scenario.sql` - Created test script for discount scenarios

## Notes

- This fix is **backward compatible** with existing data
- **No data loss** - only fixes calculation precision
- **Automatic** - applies to all existing and new students
- **Safe** - maintains all existing functionality while fixing the filtering issue
- **Tolerance-based** - uses 1 cent tolerance to handle edge cases
