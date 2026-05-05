# Leave Owed Feature - Examples

## Example 1: One User Takes Leave

### Scenario
- Danik takes 5 days off
- Leva takes 0 days off

### Calculation
```
Danik's leave: 5 days
Leva's leave: 0 days
Difference: 5 - 0 = 5 days
```

### Result
**Leva owes Danik 5 business days**

### Display
```
┌─────────────────────────────────────────────┐
│ ℹ️ Leave Owed                               │
│ Danik is owed 5 business days by Leva      │
└─────────────────────────────────────────────┘
```

---

## Example 2: Both Users Take Leave (Unbalanced)

### Scenario
- Danik takes 5 days off
- Leva takes 2 days off

### Calculation
```
Danik's leave: 5 days
Leva's leave: 2 days
Difference: 5 - 2 = 3 days
```

### Result
**Leva owes Danik 3 business days**

### Display
```
┌─────────────────────────────────────────────┐
│ ℹ️ Leave Owed                               │
│ Danik is owed 3 business days by Leva      │
└─────────────────────────────────────────────┘
```

---

## Example 3: Both Users Take Leave (Balanced)

### Scenario
- Danik takes 5 days off
- Leva takes 5 days off

### Calculation
```
Danik's leave: 5 days
Leva's leave: 5 days
Difference: 5 - 5 = 0 days
```

### Result
**No leave owed (balanced)**

### Display
```
(No leave owed alert displayed)
```

---

## Example 4: Reverse Direction

### Scenario
- Danik takes 2 days off
- Leva takes 8 days off

### Calculation
```
Danik's leave: 2 days
Leva's leave: 8 days
Difference: 2 - 8 = -6 days (Danik owes Leva)
```

### Result
**Danik owes Leva 6 business days**

### Display
```
┌─────────────────────────────────────────────┐
│ ℹ️ Leave Owed                               │
│ Leva is owed 6 business days by Danik      │
└─────────────────────────────────────────────┘
```

---

## Example 5: Multiple Leave Records

### Scenario
- Danik takes leave:
  - Record 1: 2 days (May 1-2)
  - Record 2: 3 days (May 10-12)
  - Total: 5 days
- Leva takes leave:
  - Record 1: 1 day (May 20)
  - Total: 1 day

### Calculation
```
Danik's total leave: 2 + 3 = 5 days
Leva's total leave: 1 day
Difference: 5 - 1 = 4 days
```

### Result
**Leva owes Danik 4 business days**

### Display
```
┌─────────────────────────────────────────────┐
│ ℹ️ Leave Owed                               │
│ Danik is owed 4 business days by Leva      │
└─────────────────────────────────────────────┘
```

---

## Real-World Scenario

### Timeline
```
January:
  - Danik: 3 days off
  - Leva: 0 days off
  → Leva owes Danik 3 days

February:
  - Leva: 2 days off
  → Leva owes Danik 1 day (3 - 2)

March:
  - Leva: 1 day off
  → Balanced! (3 - 3)

April:
  - Leva: 2 days off
  → Danik owes Leva 2 days (3 - 5)
```

### Home Page Display Over Time

**After January:**
```
┌─────────────────────────────────────────────┐
│ ℹ️ Leave Owed                               │
│ Danik is owed 3 business days by Leva      │
└─────────────────────────────────────────────┘
```

**After February:**
```
┌─────────────────────────────────────────────┐
│ ℹ️ Leave Owed                               │
│ Danik is owed 1 business day by Leva       │
└─────────────────────────────────────────────┘
```

**After March:**
```
(No leave owed alert - balanced!)
```

**After April:**
```
┌─────────────────────────────────────────────┐
│ ℹ️ Leave Owed                               │
│ Leva is owed 2 business days by Danik      │
└─────────────────────────────────────────────┘
```

---

## Integration with Leave Summary

### Full Home Page View

```
┌─────────────────────────────────────────────────────────┐
│                    Leave Summary                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ℹ️ Leave Owed                                     │ │
│  │ Danik is owed 3 business days by Leva            │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ Danik is on leave│  │ Leva is on leave │           │
│  │ 01/05 → 05/05    │  │ 10/05 → 12/05    │           │
│  │ (5 business days)│  │ (3 business days)│           │
│  └──────────────────┘  └──────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Key Points

1. **Automatic Calculation**: Leave owed is calculated automatically from all leave records
2. **Real-time Updates**: Updates immediately when leave is added, edited, or deleted
3. **Simple Logic**: When you take leave, others owe you that time
4. **Net Calculation**: Shows the net difference between users
5. **Visual Feedback**: Clear display on home page showing who owes whom
6. **Balanced State**: Alert disappears when leave is balanced (equal)
