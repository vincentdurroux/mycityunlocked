import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SupabaseEvent {
  id: string;
  title: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location: string;
  category: string;
  image_url: string;
  description?: string;
  lat?: number;
  lng?: number;
  user_id?: string;
  created_at?: string;
}

export const eventService = {
  /**
   * SQL TO CREATE THE TABLE IN SUPABASE:
   * 
   * create table events (
   *   id uuid default gen_random_uuid() primary key,
   *   title text not null,
   *   start_date text not null,
   *   end_date text,
   *   start_time text,
   *   end_time text,
   *   location text not null,
   *   category text not null,
   *   image_url text not null,
   *   description text,
   *   lat double precision,
   *   lng double precision,
   *   user_id uuid references auth.users(id),
   *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
   * );
   * 
   * -- Add RLS policies (adjust according to your needs)
   * alter table events enable row level security;
   * 
   * create policy "Allow public read access" on events for select using (true);
   * 
   * create policy "Allow authenticated users to insert events" on events for insert with check (
   *   auth.uid() is not null
   * );
   * 
   * create policy "Allow users to update/delete their own events" on events for all using (
   *   auth.uid() = user_id or auth.email() = 'vincentdurroux@gmail.com'
   * );
   */

  async getEvents() {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty list');
      return [];
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      image: item.image_url || item.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
      description: item.description,
      coordinates: (item.lat && item.lng) ? { lat: item.lat, lng: item.lng } : undefined
    }));
  },

  async createEvent(event: any) {
    if (!isSupabaseConfigured) return null;

    const payload = {
      title: event.title,
      start_date: event.start_date || event.date,
      end_date: event.end_date,
      start_time: event.start_time || event.time,
      end_time: event.end_time,
      location: event.location,
      category: event.category,
      image_url: event.image_url || event.image,
      description: event.description,
      lat: event.coordinates?.lat,
      lng: event.coordinates?.lng,
      user_id: event.user_id
    };

    const { data, error } = await supabase
      .from('events')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }
    return data;
  }
};
