# Balance Calculation Debug Guide

## 🚨 **Current Issue**

Group fees are appearing as refunds in receipts instead of showing as unpaid amounts in the balance. The system is not correctly tracking what students owe vs. what they have in credit.

## 🔍 **Root Cause Analysis**

### **The Problem:**
1. **Balance Calculation Logic**: The current logic calculates `totalBalance` (what student was charged) instead of `remainingUnpaid` (what student actually owes)
2. **Payment Type Categorization**: Some payments may have incorrect `payment_type` values
3. **Data Flow**: The balance data may not be properly passed to the UI components

### **Expected vs. Actual Behavior:**

#### **Expected:**
- Student joins group → Balance shows -$500 (registration) -$300 (group) = -$800
- Student pays $600 → Balance shows -$200 (remaining unpaid)
- Receipts show: +$500 (registration), +$100 (group), remaining -$200

#### **Actual (Problem):**
- Student joins group → Balance shows incorrect amount
- Group fees appear as refunds in receipts
- Balance doesn't show unpaid amounts correctly

## 🔧 **Debugging Steps**

### **Step 1: Run the Database Fix**
```sql
-- Execute fix-payment-types.sql to correct payment_type values
```

### **Step 2: Check Console Logs**
Look for the enhanced balance calculation logs:
```
Balance calculation for student STUDENT_ID:
  Total fees charged: 800
  Total amount paid: 0
  Total credits/deposits: 0
  Total unpaid amounts: 800
  Final balance: -800 (negative = owes money, positive = has credit)

Group balances breakdown:
  Registration Fee: Fee=500, Paid=0, Remaining=500 (UNPAID)
  Group A: Fee=300, Paid=0, Remaining=300 (UNPAID)
```

### **Step 3: Use Test Script**
Run `test-balance-calculation.sql` to manually verify the calculations:
1. Replace `STUDENT_ID_HERE` with an actual student ID
2. Check payment types distribution
3. Verify individual student payments
4. Compare manual calculation with system calculation

### **Step 4: Check Payment Types**
Verify that:
- Group payments have `payment_type = 'group_payment'`
- Registration fees have `payment_type = 'registration_fee'`
- Balance additions have `payment_type = 'balance_addition'`

## 📊 **Balance Calculation Logic**

### **Current Formula:**
```typescript
// What student was charged
totalBalance = registrationFee + groupFees

// What student has paid
totalPaid = registrationPayments + groupPayments

// What student has in credits
totalCredits = balanceAdditions

// What student owes (unpaid amounts)
totalUnpaid = sum of remaining amounts per group

// Final balance
remainingBalance = totalCredits - totalUnpaid
```

### **Example Calculation:**
```
Student joins group with $300 fee:
- Registration fee: $500 (charged)
- Group fee: $300 (charged)
- Total charged: $800
- Total paid: $0
- Total credits: $0
- Total unpaid: $800
- Final balance: $0 - $800 = -$800 (student owes $800)
```

## 🎯 **What to Look For**

### **In Console Logs:**
1. **Balance calculation breakdown** - should show each step clearly
2. **Group balances** - should show which groups are paid/unpaid
3. **Payment processing** - should show how payments are allocated

### **In Database:**
1. **Payment types** - should be correctly categorized
2. **Group IDs** - group payments should have valid group_id
3. **Amounts** - should match between original_amount and amount

### **In UI:**
1. **Balance display** - should show negative amounts for unpaid fees
2. **Unpaid groups list** - should show remaining amounts for each group
3. **Receipts** - should show correct payment types and amounts

## 🚀 **Quick Fixes to Try**

### **1. Clear Browser Console and Refresh**
- Clear console logs
- Refresh the payment page
- Look for new balance calculation logs

### **2. Check a Specific Student**
- Select a student who has groups
- Look at their balance calculation logs
- Verify the unpaid groups list

### **3. Test Payment Flow**
- Try to add a payment for a student
- Watch the console logs during allocation
- Check if the balance updates correctly

## 🔍 **If Issues Persist**

### **Check Database Schema:**
```sql
-- Verify payments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments';
```

### **Check Sample Data:**
```sql
-- Look at actual payment records
SELECT id, student_id, group_id, amount, payment_type, notes
FROM payments 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Verify Group Data:**
```sql
-- Check if groups have correct prices
SELECT id, name, price, start_date
FROM groups 
ORDER BY start_date;
```

## 📝 **Expected Results After Fix**

1. **Student joins group** → Balance shows negative amount (what they owe)
2. **Unpaid groups list** → Shows remaining amounts for each group
3. **Receipts** → Show correct payment types (not refunds)
4. **Balance calculation** → Accurately reflects paid vs. unpaid amounts

## 🎯 **Next Steps**

1. **Run the database fix script**
2. **Check console logs** for balance calculation details
3. **Test with a specific student** to verify the fix
4. **Report any remaining issues** with specific error messages

---

The enhanced logging and debugging tools should help identify exactly where the balance calculation is going wrong.
