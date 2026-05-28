import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Feedback {
  id?: string;
  user_id?: string;
  user_email?: string;
  category: string; // 'bug', 'suggestion', 'compliment', 'other'
  comment: string;
  created_at?: string;
}

/**
 * SQL SCHEMA FOR SUPABASE DATABASE:
 * 
 * -- OPTION 1: Drop your existing feedbacks table and recreate it fresh (Recommandé)
 * DROP TABLE IF EXISTS feedbacks;
 * 
 * create table feedbacks (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users(id) on delete set null,
 *   user_email text,
 *   category text not null,
 *   comment text not null,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Enable Row Level Security (RLS)
 * alter table feedbacks enable row level security;
 * 
 * -- Policy: Anyone can submit feedback (Insert)
 * create policy "Allow anyone to insert feedback" on feedbacks 
 *   for insert 
 *   with check (true);
 * 
 * -- Policy: Only administrators can view submitted feedback (Select)
 * create policy "Allow admins to read feedback" on feedbacks 
 *   for select 
 *   using (
 *     auth.email() = 'vincentdurroux@gmail.com' or 
 *     (select is_admin from profiles where id = auth.uid()) = true
 *   );
 * 
 * -------------------------------------------------------------
 * -- OPTION 2: If you want to keep the existing feedbacks table and just remove the rating column constraint
 * ALTER TABLE feedbacks DROP COLUMN IF EXISTS rating;
 */

export const feedbackService = {
  /**
   * Submits feedback to Supabase (or fallback to local performance/logs if not configured)
   */
  async submitFeedback(feedback: Omit<Feedback, 'id' | 'created_at'>): Promise<any> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Mock saving feedback:', feedback);
      // Simulate storage delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      return { id: 'mock-' + Math.random().toString(36).substr(2, 9), ...feedback, created_at: new Date().toISOString() };
    }

    const { data, error } = await supabase
      .from('feedbacks')
      .insert([
        {
          user_id: feedback.user_id || null,
          user_email: feedback.user_email || null,
          category: feedback.category,
          comment: feedback.comment
        }
      ])
      .select();

    if (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }

    return data?.[0] || null;
  },

  /**
   * Fetches all feedback entries (For potential Admin usage)
   */
  async getFeedbacks(): Promise<Feedback[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty feedback list.');
      return [];
    }

    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedbacks:', error);
      return [];
    }

    return data || [];
  }
};
