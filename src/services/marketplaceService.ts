import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Ad {
  id: string;
  created_at: string;
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  location: string;
  type?: string;
  fuel_type?: string;
  property_type?: string;
  contract_type?: string;
  size?: string;
  image_url: string;
  images?: string[];
  user_id?: string;
  seller_name?: string;
  seller_image?: string;
}

const MOCK_ADS: Ad[] = [
  { 
    id: '1', 
    title: 'Vintage Bicycle', 
    price: '€80', 
    category: 'Leisure', 
    condition: 'Good',
    location: 'Ruzafa',
    image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=200&h=200',
    created_at: new Date().toISOString(),
    description: 'A beautiful vintage bicycle in great condition.',
    seller_name: 'Marco Rossi',
    seller_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100'
  },
  { 
    id: '2', 
    title: 'Room in Ruzafa', 
    price: '€450/mo', 
    category: 'Real Estate', 
    condition: 'N/A',
    type: 'Rent',
    property_type: 'Apartment',
    location: 'Ruzafa',
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=200&h=200',
    created_at: new Date().toISOString(),
    description: 'Spacious room in a shared apartment.',
    seller_name: 'Elena Garcia',
    seller_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100'
  },
  {
    id: '3',
    title: 'Tesla Model 3',
    price: '€35,000',
    category: 'Vehicles',
    condition: 'Like New',
    fuel_type: 'Electric',
    location: 'Valencia Center',
    image_url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=400&h=300',
    created_at: new Date().toISOString(),
    description: 'Pristine condition Tesla Model 3, low mileage.',
    seller_name: 'David Wilson',
    seller_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100'
  }
];

export const marketplaceService = {
  async getAds() {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock ads');
      return MOCK_ADS;
    }

    try {
      const { data, error } = await supabase
        .from('marketplace')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Ad[];
    } catch (error) {
      console.error('Error fetching ads from Supabase:', error);
      return MOCK_ADS;
    }
  },

  async createAd(ad: Omit<Ad, 'id' | 'created_at'>) {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, mock creating ad');
      const newAd: Ad = {
        ...ad,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      return newAd;
    }

    const { data, error } = await supabase
      .from('marketplace')
      .insert([ad])
      .select()
      .single();

    if (error) throw error;
    return data as Ad;
  },

  async deleteAd(id: string) {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, mock deleting ad');
      return;
    }

    const { error } = await supabase
      .from('marketplace')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
