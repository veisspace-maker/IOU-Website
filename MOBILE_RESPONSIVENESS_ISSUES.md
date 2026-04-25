# Mobile Responsiveness Issues Found

## Critical Issues

### 1. **HomePage Navigation Cards**
- Cards use `py: 4` which creates excessive vertical padding on mobile
- Icon/emoji sizing not responsive
- Description text could be smaller on mobile

### 2. **Transaction History & Sales Transaction List**
- Font sizes too large on mobile (h6 = 1.25rem, body1 = 1rem)
- List items have excessive padding (`py: 2.5` on xs)
- Expand/collapse icons not properly sized
- Edit forms inside collapsed sections don't adapt well to mobile

### 3. **Forms (TransactionForm, AddSalesTransactionForm, LeaveEntryForm)**
- Input fields stack correctly but padding is excessive
- Helper text on price fields can overflow
- Date pickers need better mobile handling

### 4. **DebtDisplay & Summary Cards**
- Typography sizes (h4, h5) too large for mobile screens
- Card padding not optimized for small screens

### 5. **LeaveCalendar**
- Calendar cells too small on mobile (`minHeight: 60px` on xs)
- Chip labels too small (`fontSize: 0.563rem`)
- Touch targets too small for mobile interaction
- Month/year selector popover not mobile-optimized

### 6. **Settings Page**
- Tab labels can overflow on small screens
- Drag-and-drop on mobile needs better touch handling (already has 500ms delay but could be improved)

### 7. **General Typography Issues**
- Many h4, h5, h6 headings don't scale down for mobile
- Body text often uses fixed sizes instead of responsive breakpoints
- Insufficient use of `{ xs: value, sm: value }` patterns

## Recommendations

1. **Reduce all padding/margins by 25-50% on xs breakpoint**
2. **Scale down typography:**
   - h4: { xs: '1.5rem', sm: '2.125rem' }
   - h5: { xs: '1.25rem', sm: '1.5rem' }
   - h6: { xs: '1rem', sm: '1.25rem' }
   - body1: { xs: '0.875rem', sm: '1rem' }

3. **Increase touch targets to minimum 44x44px**
4. **Reduce calendar cell content on mobile**
5. **Simplify expanded edit forms on mobile**
6. **Add more responsive breakpoints throughout**

## Files Requiring Updates

- frontend/src/pages/HomePage.tsx
- frontend/src/components/TransactionHistory.tsx
- frontend/src/components/SalesTransactionList.tsx
- frontend/src/components/TransactionForm.tsx
- frontend/src/components/AddSalesTransactionForm.tsx
- frontend/src/components/DebtDisplay.tsx
- frontend/src/components/DebtSummaryCard.tsx
- frontend/src/components/LeaveSummaryCards.tsx
- frontend/src/components/LeaveCalendar.tsx
- frontend/src/components/LeaveHistory.tsx
- frontend/src/components/LeaveEntryForm.tsx
- frontend/src/components/SalesStatsCards.tsx
