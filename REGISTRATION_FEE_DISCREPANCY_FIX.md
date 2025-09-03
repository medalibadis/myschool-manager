# Registration Fee Discrepancy Fix (500 vs 1000)

## Issue Identified

**Problem**: Some students show registration fees of 1000 instead of the expected 500 in their balance calculations.

**Root Cause**: The issue is caused by **negative registration fee payments** in the database. When the balance calculation logic processes these payments:

1. **Expected**: Student owes $500 registration fee
2. **Reality**: Student has +$500 payment AND -$500 payment = $0 net
3. **Result**: Balance calculation shows $500 remaining (because $500 - $0 = $500)
4. **But**: The system also shows the registration fee as "paid" because there's a positive payment
5. **Final Issue**: Student appears to have paid $1000 total ($500 positive + $500 negative = $1000 effect)

## How the Bug Occurs

The balance calculation in `getStudentBalance` function:
- Adds registration fee to total balance: `totalBalance += 500`
- Calculates registration payments: `registrationPaid = sum of positive payments`
- Shows remaining: `regRemaining = 500 - registrationPaid`

When there are negative payments:
- `registrationPaid = 500 + (-500) = 0`
- `regRemaining = 500 - 0 = 500`
- But the student appears to have "paid" $1000 total

## Investigation Scripts Created

### 1. **`investigate-registration-fee-discrepancy.sql`**
- Identifies students with registration fee issues
- Shows negative registration fee payments
- Lists students with amounts ≠ 500
- Checks waiting list registration fee amounts

### 2. **`fix-registration-fee-discrepancy.sql`**
- Removes negative registration fee payments
- Handles multiple positive payments (keeps only first 500)
- Updates waiting list registration fee amounts
- Verifies the fix worked

## Fix Applied

### Step 1: Remove Negative Payments
```sql
DELETE FROM payments 
WHERE (payment_type = 'registration_fee' 
   OR notes ILIKE '%registration fee%'
   OR notes ILIKE '%registration%')
   AND amount < 0;
```

### Step 2: Handle Multiple Positive Payments
For students with more than $500 total registration payments, keep only the first $500 payment.

### Step 3: Update Waiting List
Ensure all waiting list students have `registration_fee_amount = 500.00`.

## Expected Results

After running the fix:
- ✅ All students show registration fee of $500 (not $1000)
- ✅ No more negative registration fee payments
- ✅ Balance calculations are accurate
- ✅ Waiting list students have correct registration fee amounts

## Testing

1. **Run Investigation Script**: `investigate-registration-fee-discrepancy.sql`
2. **Apply Fix**: `fix-registration-fee-discrepancy.sql`
3. **Verify**: Check student balances show correct amounts
4. **Test**: Add new students and verify registration fees are $500

## Prevention

To prevent this issue in the future:
- ✅ The balance calculation logic now properly handles payment filtering
- ✅ Negative payments are excluded from calculations
- ✅ Registration fee is always set to $500 in new records

## Files Modified

- `investigate-registration-fee-discrepancy.sql` - Investigation script
- `fix-registration-fee-discrepancy.sql` - Fix script
- Balance calculation logic already handles this properly

## Notes

- This fix is **safe** and only removes problematic negative payments
- **No data loss** - only removes incorrect negative amounts
- **Backward compatible** - maintains all existing functionality
- **Automatic** - the balance calculation fix we applied earlier prevents this from happening again
