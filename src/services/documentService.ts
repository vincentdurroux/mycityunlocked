import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AppDocument {
  id?: string;
  key: string;
  title: string;
  content: string;
  updated_at?: string;
}

// SQL TO CREATE THE TABLE IN SUPABASE:
// 
// create table if not exists public.app_documents (
//   id uuid default gen_random_uuid() primary key,
//   key text unique not null, -- 'privacy_policy', 'terms_of_service', 'community_guidelines', 'cookie_policy', 'user_terms'
//   title text not null,
//   content text not null,
//   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
// );
// 
// -- Enable RLS
// alter table public.app_documents enable row level security;
// 
// -- Create policy to allow public select
// create policy "Allow public read access to app documents"
//   on public.app_documents for select
//   using (true);
// 
// -- Create policy to allow admin updates (by email check or is_admin flag)
// create policy "Allow admins to modify documents"
//   on public.app_documents for all
//   using (
//     auth.jwt() ->> 'email' = 'vincentdurroux@gmail.com' 
//     or (select is_admin from public.profiles where id = auth.uid())
//   );
// 
// -- Insert starting data
// insert into public.app_documents (key, title, content)
// values 
// ('privacy_policy', 'Privacy Policy', '# Privacy Policy\n\nYour privacy is dynamic and protected. At Unlocked, we value your trust.\n\n### 1. Information Collection\nWe only collect essential details to register your profile and connect you with qualified services.\n\n### 2. General Data Protection\nYour confidential contact information (email, phone number) is blurred by default for unauthenticated visitors and only revealed after an approved connection.'),
// ('terms_of_service', 'Provider Terms & Conditions', '# Provider Terms & Conditions\n\nWelcome to Unlocked. These Terms and Conditions govern your use of the website.\n\n### 1. Professional Recommendations\nAny recommendation published on Unlocked must be verified by real users. False testimonials are strictly forbidden.\n\n### 2. Code of Conduct\nUsers are expected to communicate respectfully in both general channels and direct messages.'),
// ('community_guidelines', 'Community Guidelines', '# Community Guidelines\n\n### 1. Transparency & Trust\nOnly recommend professionals you have personally hired or verified.\n\n### 2. Professionalism\nConstructive reviews, honest feedback, and mutual respect.'),
// ('cookie_policy', 'Cookie Policy', '# Cookie Policy\n\nAt Unlocked, we believe in being clear and open about how we collect and use data related to you.\n\n### 1. What Are Cookies?\nCookies are small text files sent by us to your computer or mobile device. They are unique to your account or your browser.\n\n### 2. How We Use Them\nWe use cookies to keep you signed in, remember your city preferences (such as Valencia), and ensure a smooth application experience.'),
// ('user_terms', 'User Terms & Conditions', '# User Terms & Conditions\n\nThese User Terms and Conditions govern your access to and use of Unlocked platform services.\n\n### 1. Account Security\nYou must secure your credentials. You are responsible for any activity performed under your account.\n\n### 2. Acceptable Use\nYou agree not to misuse the direct messaging system, scrape content, or post inaccurate local profiles.');

const DEFAULT_DOCUMENTS: Record<string, AppDocument> = {
  privacy_policy: {
    key: 'privacy_policy',
    title: 'Privacy Policy',
    content: `# Privacy Policy\n\nYour privacy is dynamic and protected. At Unlocked, we value your trust.\n\n### 1. Information Collection\nWe only collect essential details to register your profile and connect you with qualified services.\n\n### 2. General Data Protection\nYour confidential contact information (email, phone number) is blurred by default for unauthenticated visitors and only revealed after an approved connection.`
  },
  terms_of_service: {
    key: 'terms_of_service',
    title: 'Provider Terms & Conditions',
    content: `# Provider Terms & Conditions\n\nWelcome to Unlocked. These Terms and Conditions govern your use of the website.\n\n### 1. Professional Recommendations\nAny recommendation published on Unlocked must be verified by real users. False testimonials are strictly forbidden.\n\n### 2. Code of Conduct\nUsers are expressed to communicate respectfully in both general channels and direct messages.`
  },
  community_guidelines: {
    key: 'community_guidelines',
    title: 'Community Guidelines',
    content: `# Community Guidelines\n\n### 1. Transparency & Trust\nOnly recommend professionals you have personally hired or verified.\n\n### 2. Professionalism\nConstructive reviews, honest feedback, and mutual respect.`
  },
  cookie_policy: {
    key: 'cookie_policy',
    title: 'Cookie Policy',
    content: `# Cookie Policy\n\nAt Unlocked, we believe in being clear and open about how we collect and use data related to you.\n\n### 1. What Are Cookies?\nCookies are small text files sent by us to your computer or mobile device. They are unique to your account or your browser.\n\n### 2. How We Use Them\nWe use cookies to keep you signed in, remember your city preferences (such as Valencia), and ensure a smooth navigation flow.`
  },
  user_terms: {
    key: 'user_terms',
    title: 'User Terms & Conditions',
    content: `# User Terms & Conditions\n\nThese User Terms and Conditions govern your access to and use of Unlocked platform services as an active member.\n\n### 1. Account Security\nYou must secure your credentials. You are responsible for any activity performed under your account.\n\n### 2. Acceptable Use\nYou agree not to misuse the direct messaging system, scrape content, or post inaccurate local profiles.`
  }
};

export const documentService = {
  async getDocument(key: string): Promise<AppDocument> {
    if (!isSupabaseConfigured) {
      return DEFAULT_DOCUMENTS[key] || { key, title: 'Document', content: 'Not configured.' };
    }
    try {
      const { data, error } = await supabase
        .from('app_documents')
        .select('*')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      if (data) return data;
      
      return DEFAULT_DOCUMENTS[key] || { key, title: 'Document', content: 'Not found.' };
    } catch (e) {
      console.warn(`[documentService] Error fetching document "${key}" from database, using fallback:`, e);
      return DEFAULT_DOCUMENTS[key] || { key, title: 'Document', content: 'Connection error.' };
    }
  },

  async updateDocument(key: string, title: string, content: string): Promise<AppDocument> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase
      .from('app_documents')
      .upsert({ key, title, content, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
