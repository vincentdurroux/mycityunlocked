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
 * -- RESET RLS POLICIES FOR FEEDBACKS (Si vous avez l'erreur 42501)
 * DROP POLICY IF EXISTS "Allow anyone to insert feedback" ON feedbacks;
 * DROP POLICY IF EXISTS "Allow authenticated users to insert feedback" ON feedbacks;
 * DROP POLICY IF EXISTS "Allow admins to read feedback" ON feedbacks;
 * 
 * -- Enable Row Level Security (RLS)
 * ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
 * 
 * -- Policy: Allow ALL users (authenticated and anonymous) to submit feedback
 * CREATE POLICY "Allow anyone to insert feedback" ON feedbacks 
 *   FOR INSERT TO public
 *   WITH CHECK (true);
 * 
 * -- Policy: Only administrators can view entries
 * CREATE POLICY "Allow admins to read feedback" ON feedbacks 
 *   FOR SELECT TO authenticated
 *   USING (
 *     auth.email() = 'vincentdurroux@gmail.com' OR 
 *     (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
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

    // Clean data before sending to Supabase to avoid RLS issues with empty strings or undefined
    const insertData: any = {
      category: feedback.category,
      comment: feedback.comment
    };

    if (feedback.user_id) {
      insertData.user_id = feedback.user_id;
    }
    
    if (feedback.user_email) {
      insertData.user_email = feedback.user_email;
    }

    const { data, error } = await supabase
      .from('feedbacks')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Error submitting feedback details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        sentData: insertData
      });
      
      if (error.code === '42501') {
        const sqlToRun = `
-- COPY AND RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX FEEDBACK PERMISSIONS:

-- 1. Enable RLS on feedbacks table
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- 2. Drop any previous conflicting policies
DROP POLICY IF EXISTS "Allow anyone to insert feedback" ON feedbacks;
DROP POLICY IF EXISTS "Allow authenticated users to insert feedback" ON feedbacks;

-- 3. Create the permissive insertion policy
CREATE POLICY "Allow members to submit feedback" 
ON feedbacks 
FOR INSERT 
TO public 
WITH CHECK (true);

-- 4. Verify
-- This allows both logged-in users and anonymous visitors to submit feedback.
        `.trim();
        
        const rlsError = new Error('Permission denied (Row Level Security).');
        (rlsError as any).code = 'RLS_ERROR';
        (rlsError as any).sql = sqlToRun;
        throw rlsError;
      }
      
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
