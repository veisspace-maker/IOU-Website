# Leave Owed Feature - Testing Guide

## Prerequisites
- Backend server running on port 3001
- Frontend server running on port 5173
- At least 2 users in the system (e.g., Danik and Leva)
- Logged in as one of the users

## Test Scenarios

### Test 1: Initial State (No Leave)
**Expected Result:** No leave owed alert displayed

**Steps:**
1. Navigate to Home page
2. Scroll to "Leave Summary" section
3. Verify no "Leave Owed" alert is shown
4. Should only see "No current or upcoming leave scheduled" message

---

### Test 2: One User Takes Leave
**Expected Result:** Leave owed alert shows the other user owes them

**Steps:**
1. Navigate to Leave page
2. Click "Add Leave" or select dates on calendar
3. Select start date: May 1, 2026
4. Select end date: May 5, 2026
5. Verify business days shows: 5 days
6. Click "Submit"
7. Navigate to Home page
8. Verify Leave Owed alert shows:
   - "Danik is owed 5 business days by Leva" (if Danik took leave)
   - OR "Leva is owed 5 business days by Danik" (if Leva took leave)

---

### Test 3: Second User Takes Leave (Unbalanced)
**Expected Result:** Leave owed alert updates to show net difference

**Steps:**
1. Log in as the other user (or switch user)
2. Navigate to Leave page
3. Add leave: May 10-11, 2026 (2 business days)
4. Navigate to Home page
5. Verify Leave Owed alert updates to show:
   - "Danik is owed 3 business days by Leva" (if Danik had 5, Leva has 2)

---

### Test 4: Balance the Leave
**Expected Result:** Leave owed alert disappears

**Steps:**
1. As the user who owes leave, add more leave
2. Add enough days to balance (e.g., 3 more days)
3. Navigate to Home page
4. Verify Leave Owed alert is no longer displayed
5. Both users should have equal total leave days

---

### Test 5: Edit Existing Leave
**Expected Result:** Leave owed recalculates automatically

**Steps:**
1. Navigate to Leave page
2. Find an existing leave record
3. Click edit icon
4. Change the end date to extend the leave
5. Click "Save"
6. Navigate to Home page
7. Verify Leave Owed alert updates with new calculation

---

### Test 6: Delete Leave
**Expected Result:** Leave owed recalculates without deleted record

**Steps:**
1. Navigate to Leave page
2. Find an existing leave record
3. Click delete icon
4. Confirm deletion
5. Navigate to Home page
6. Verify Leave Owed alert updates (may disappear if balanced)

---

### Test 7: Multiple Leave Records
**Expected Result:** All leave records are summed correctly

**Steps:**
1. Add multiple leave records for one user:
   - Record 1: 2 days
   - Record 2: 3 days
   - Record 3: 1 day
2. Add one leave record for other user:
   - Record 1: 2 days
3. Navigate to Home page
4. Verify Leave Owed shows: 4 days owed (6 - 2)

---

### Test 8: API Endpoint Test
**Expected Result:** API returns correct leave owed data

**Steps:**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Run this command:
```javascript
fetch('/api/leave/owed', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```
4. Verify response format:
```json
{
  "debtor": "user-id",
  "creditor": "user-id",
  "amount": 3
}
```

---

### Test 9: Refresh Behavior
**Expected Result:** Leave owed persists after page refresh

**Steps:**
1. Navigate to Home page with leave owed displayed
2. Note the current leave owed amount
3. Refresh the page (F5)
4. Verify Leave Owed alert still shows same amount
5. Data should be fetched from backend on each load

---

### Test 10: Concurrent Updates
**Expected Result:** Leave owed updates when other user adds leave

**Steps:**
1. Open two browser windows (or use incognito for second user)
2. Log in as User 1 in first window
3. Log in as User 2 in second window
4. In User 1 window, add leave
5. In User 2 window, refresh Home page
6. Verify Leave Owed alert appears/updates
7. In User 2 window, add leave
8. In User 1 window, refresh Home page
9. Verify Leave Owed alert updates with net difference

---

## Automated Test

### Backend Unit Tests
```bash
cd backend
npm test -- leaveOwedCalculations.test.ts
```

**Expected Output:**
```
✓ should return zero debt when no leave records exist
✓ should calculate debt when one user takes leave
✓ should calculate net debt when both users take leave
✓ should return zero debt when leave is balanced
✓ should handle reverse debt direction
✓ should handle multiple leave records per user
✓ should return zero for non-2-person systems

Test Files  1 passed (1)
     Tests  7 passed (7)
```

---

## Visual Verification Checklist

### Home Page - Leave Summary Section
- [ ] Leave Owed alert appears when there's a non-zero balance
- [ ] Alert shows correct user names (not user IDs)
- [ ] Alert shows correct number of business days
- [ ] Alert shows correct direction (who owes whom)
- [ ] Alert uses info severity (blue color)
- [ ] Alert disappears when leave is balanced
- [ ] Current/upcoming leave cards still display below alert
- [ ] Layout is responsive on mobile devices

### Leave Page
- [ ] Adding leave updates leave owed on Home page
- [ ] Editing leave updates leave owed on Home page
- [ ] Deleting leave updates leave owed on Home page
- [ ] Business days calculation is correct
- [ ] No errors in browser console

---

## Edge Cases to Test

### Edge Case 1: Same Day Leave
**Steps:**
1. Add leave with same start and end date
2. Verify it counts as 1 business day
3. Check leave owed calculation includes it

### Edge Case 2: Weekend Leave
**Steps:**
1. Try to add leave on Saturday-Sunday
2. Should be disabled in date picker
3. If somehow added, should calculate 0 business days

### Edge Case 3: Holiday Leave
**Steps:**
1. Add a public holiday in Settings
2. Try to add leave including that holiday
3. Holiday should be excluded from business days count
4. Leave owed should reflect correct business days

### Edge Case 4: Past Leave
**Steps:**
1. Add leave in the past
2. Should show warning but allow submission
3. Leave owed should still calculate correctly
4. Past leave should not show in upcoming leave cards

### Edge Case 5: Very Long Leave
**Steps:**
1. Add leave spanning multiple weeks
2. Verify business days calculation is correct
3. Leave owed should handle large numbers correctly

---

## Troubleshooting

### Issue: Leave Owed Not Showing
**Check:**
- Are there any leave records in the system?
- Is the leave balanced (equal days)?
- Check browser console for errors
- Verify API endpoint returns data: `GET /api/leave/owed`

### Issue: Wrong Amount Displayed
**Check:**
- Verify all leave records are counted
- Check business days calculation for each record
- Ensure weekends/holidays are excluded correctly
- Test with manual calculation

### Issue: Wrong User Names
**Check:**
- Verify users are fetched correctly
- Check user ID mapping in component
- Ensure user IDs match between leave records and users

### Issue: Alert Not Updating
**Check:**
- Refresh the page manually
- Check if API is being called on page load
- Verify leave records are being updated in database
- Check browser console for errors

---

## Performance Testing

### Load Test
1. Add 100+ leave records
2. Navigate to Home page
3. Verify leave owed calculates quickly (< 1 second)
4. Check browser console for performance warnings

### Network Test
1. Open browser developer tools
2. Go to Network tab
3. Navigate to Home page
4. Verify only one API call to `/api/leave/owed`
5. Check response time is reasonable (< 500ms)

---

## Acceptance Criteria

✅ Feature is complete when:
- [ ] Leave owed alert displays on Home page
- [ ] Calculation is correct for all scenarios
- [ ] Updates automatically when leave changes
- [ ] Shows correct user names
- [ ] Handles balanced state (no alert)
- [ ] Works for 2-person system
- [ ] All unit tests pass
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Documentation is complete
