import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_admin?: boolean;
  chat_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const authService = {
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signInWithEmail(email: string) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    
    // Using magic link by default which is safer and easier
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  async updateProfile(profile: Partial<Profile>) {
    if (!profile.id) throw new Error('User ID is required');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsertProfile(profile: Partial<Profile>) {
    if (!profile.id) throw new Error('User ID is required');

    // First check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile.id)
      .maybeSingle();

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();
      
      if (error && error.code === '42703' && ('chat_enabled' in profile)) {
        console.warn('chat_enabled column is missing, please update the schema. Skipping error.');
        return existing;
      }
      
      if (error) throw error;
      return data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error && error.code === '42703' && ('chat_enabled' in profile)) {
        console.warn('chat_enabled column is missing, please update the schema. Skipping error.');
        return profile;
      }

      if (error) throw error;
      return data;
    }
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`avatars/${filePath}`, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(`avatars/${filePath}`);

    return publicUrl;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

/**
 * SQL to create the profiles table in Supabase:
 * 
 * create table profiles (
 *   id uuid references auth.users on delete cascade not null primary key,
 *   email text unique not null,
 *   full_name text,
 *   avatar_url text,
 *   is_admin boolean default false,
 *   chat_enabled boolean default true,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Set up Row Level Security
 * alter table profiles enable row level security;
 * 
 * create policy "Public profiles are viewable by everyone."
 *   on profiles for select
 *   using ( true );
 * 
 * create policy "Users can insert their own profile."
 *   on profiles for insert
 *   with check ( auth.uid() = id );
 * 
 * create policy "Users can update own profile."
 *   on profiles for update
 *   using ( auth.uid() = id );
 * 
 * -- Create a trigger to handle new user signups
 * create or replace function public.handle_new_user()
 * returns trigger as $$
 * begin
 *   insert into public.profiles (id, email, full_name, avatar_url)
 *   values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 * 
 * create trigger on_auth_user_created
 *   after insert on auth.users
 *   for each row execute procedure public.handle_new_user();
 */
