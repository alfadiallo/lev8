import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, institution, specialty, title } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id, source')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      // User exists - return their info (don't update lev8 users)
      if (existingUser.source === 'lev8') {
        return NextResponse.json({
          message: 'User already exists in lev8',
          userId: existingUser.id,
          isLev8User: true,
        });
      }

      // Update eqpqiq user profile
      const { data: updatedUser, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          institution: institution || null,
          specialty: specialty || null,
          title: title || null,
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('[register] Update error:', updateError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Profile updated',
        userId: updatedUser.id,
        user: updatedUser,
      });
    }

    // Create new user profile (source: eqpqiq)
    const { data: newUser, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        email: email.toLowerCase(),
        full_name: fullName,
        institution: institution || null,
        specialty: specialty || null,
        title: title || null,
        role: 'faculty', // Default role for interview users
        source: 'eqpqiq',
      })
      .select()
      .single();

    if (createError) {
      console.error('[register] Create error:', createError);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Profile created',
      userId: newUser.id,
      user: newUser,
    }, { status: 201 });
  } catch (error) {
    console.error('[register] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, institution, specialty, title, role, source')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[register] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({
      exists: !!user,
      isLev8User: user?.source === 'lev8',
      user: user || null,
    });
  } catch (error) {
    console.error('[register] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
