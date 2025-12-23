# Testing MED-001 Vignette

## ✅ Setup Complete!

All database setup is complete:
- ✅ Base schema created
- ✅ Initial data seeded
- ✅ RLS policies enabled
- ✅ MED-001 vignette imported (global, available to all institutions)

## 🧪 Testing Steps

### 1. Verify You Can Log In
- Log in as a **resident user** (or create one if needed)
- Ensure the user has:
  - A profile in `user_profiles` table
  - Role set to `'resident'`
  - `institution_id` set to your health system

### 2. Navigate to Difficult Conversations Module
- From the dashboard, navigate to the **Learn** bucket
- Click on **Difficult Conversations** module
- You should see the MED-001 vignette listed

### 3. Start MED-001 Vignette
- Click on "Disclosing a Medication Error: Adenosine Administration in VT"
- The vignette should load with:
  - Clinical context
  - Avatar characters
  - Conversation interface

### 4. Test Conversation Flow
- **Opening Phase**: Start the conversation
- **Disclosure Phase**: Practice disclosing the error
- **Emotional Processing**: Respond to the patient's emotions
- **Next Steps**: Discuss follow-up actions

### 5. Verify Assessment
- Complete the conversation
- Check that assessment scores are calculated
- Verify phase transitions work correctly
- Confirm emotional state tracking is active

## 🐛 Troubleshooting

### Can't See the Vignette?
1. **Check RLS Policies**: Ensure you're logged in and RLS allows access
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'vignettes';
   ```

2. **Verify Vignette is Global**: Check that `institution_id IS NULL`
   ```sql
   SELECT id, title, institution_id FROM public.vignettes WHERE title LIKE '%Adenosine%';
   ```

3. **Check Module Access**: Ensure the module is active and available to your role
   ```sql
   SELECT * FROM public.modules WHERE slug = 'difficult-conversations';
   ```

4. **Verify User Profile**: Check your user profile exists and has correct role
   ```sql
   SELECT id, email, role, institution_id FROM public.user_profiles WHERE id = auth.uid();
   ```

### API Errors?
- Check browser console for errors
- Verify API routes are working: `/api/vignettes`
- Check that Supabase environment variables are set correctly

### Conversation Not Starting?
- Verify the vignette data structure is correct
- Check that the conversation engine is initialized
- Look for errors in the API route: `/api/conversations/v2/chat`

## 🎯 Success Criteria

You'll know everything is working when:
- ✅ You can see MED-001 in the vignette list
- ✅ You can start a conversation
- ✅ The AI responds appropriately
- ✅ Phase transitions work
- ✅ Assessment scores are calculated
- ✅ Emotional state tracking works

## 📝 Next Steps After Testing

Once MED-001 is working:
1. Test with different user roles (faculty, program director)
2. Create additional vignettes
3. Test assessment scoring accuracy
4. Verify RLS policies with multiple institutions
5. Test the full conversation flow end-to-end



