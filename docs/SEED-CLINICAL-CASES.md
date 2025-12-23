# Seed Clinical Cases - Quick Guide

## Overview
This optional step adds 8 Emergency Medicine clinical cases to the "Learn" module.

---

## 📋 Clinical Cases Included

| # | Title | Difficulty | Duration | Topic |
|---|-------|------------|----------|-------|
| 1 | Acute Chest Pain - STEMI | Intermediate | 30 min | Cardiology |
| 2 | Septic Shock - Pneumonia | Advanced | 45 min | Infectious Disease |
| 3 | Acute Ischemic Stroke - tPA | Advanced | 30 min | Neurology |
| 4 | Multi-System Trauma - MVA | Advanced | 60 min | Trauma |
| 5 | Pediatric Asthma Exacerbation | Intermediate | 30 min | Pediatrics |
| 6 | Acute Appendicitis | Beginner | 20 min | General Surgery |
| 7 | Hypoglycemia in Diabetic | Beginner | 15 min | Endocrine |
| 8 | Anaphylaxis - Food Allergy | Intermediate | 20 min | Allergy/Immunology |

---

## 🚀 How to Seed

### **Step 1: Open Supabase SQL Editor**
```
https://supabase.com/dashboard/project/YOUR_PROJECT/sql
```

### **Step 2: Run the Seed Script**
Copy and paste the contents of:
```
scripts/seed-clinical-cases.sql
```

### **Step 3: Verify**
You should see:
```
✅ Created 8 Emergency Medicine clinical cases
```

And a table showing all 8 cases.

---

## 🔍 Verify in the App

1. **Navigate to Clinical Cases:**
   ```
   http://localhost:3000/modules/learn/clinical-cases
   ```

2. **You should see 8 case cards** with:
   - Title
   - Difficulty badge (Beginner/Intermediate/Advanced)
   - Specialty
   - Estimated duration
   - Description

3. **Filter by difficulty** using the dropdown

---

## 📊 Case Data Structure

Each case includes:
- **Patient demographics** (age, sex, vital signs)
- **Presentation** (chief complaint, history)
- **Learning objectives** (educational goals)
- **Key findings** (diagnostic clues)

Example:
```json
{
  "patient": {
    "age": 58,
    "sex": "male",
    "chief_complaint": "Chest pain",
    "vital_signs": {
      "bp": "160/95",
      "hr": 105,
      "rr": 22,
      "temp": 98.6,
      "spo2": 94
    }
  },
  "presentation": "...",
  "learning_objectives": [...],
  "key_findings": [...]
}
```

---

## 🎯 Next Steps

After seeding clinical cases, you can:

1. **Test the UI** - Browse and filter cases
2. **Start a case** - Click on a case card to begin
3. **Create more cases** - Use the educator interface (future feature)
4. **Track attempts** - View resident progress (future feature)

---

## ⚠️ Troubleshooting

### **Error: Memorial Healthcare System not found**
**Solution:** Run `scripts/import-memorial-residents.sql` first

### **No cases showing in UI**
**Solution:** Check:
- Cases are marked `is_active = true`
- Cases are marked `is_public = true`
- User has appropriate role permissions

### **Permission denied**
**Solution:** Ensure RLS policies allow read access for residents

---

## 🔐 Security Notes

- Cases are institution-specific (linked to Memorial Healthcare)
- `is_public = true` makes them visible to all residents in the institution
- `is_active = true` makes them appear in the UI
- Educators can create additional cases via API

---

*Last updated: November 15, 2025*


