import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SupabaseProfessional {
  id: string;
  name: string;
  company_name?: string;
  profession: string;
  rating: number;
  reviews_count?: number; // Kept for type compatibility if needed
  review_count?: number;
  languages: string[];
  image_url: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  facebook?: string;
  location: string;
  lat?: number;
  lng?: number;
  created_at?: string;
}

export const proService = {
  isAdmin(email?: string | null) {
    const adminEmails = ['vincentdurroux@gmail.com']; // You can add more admins here
    return !!email && adminEmails.includes(email);
  },

  async getProfessionals() {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty list');
      return [];
    }

    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching professionals:', error);
      throw error;
    }

    console.log('[proService] Raw data from Supabase:', data);

    const mappedData = data.map((item: any) => {
      // Normalize lat/lng from columns, handling strings if necessary
      let lat = typeof item.lat === 'string' ? parseFloat(item.lat) : item.lat;
      let lng = typeof item.lng === 'string' ? parseFloat(item.lng) : item.lng;
      let displayLocation = item.location || '';

      // Fallback: Check if coordinates are bundled in the location field if columns are empty/invalid
      // We check both lat and lng to be safe, using a small epsilon
      const hasValidColumns = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && 
                              (Math.abs(lat) > 0.0001 || Math.abs(lng) > 0.0001);
      
      if (!hasValidColumns && typeof displayLocation === 'string' && (displayLocation.startsWith('GEO:') || displayLocation.includes('GEO:'))) {
        try {
          // More flexible regex to match GEO:lat,lng|Address even if there are spaces
          const geoMatch = displayLocation.match(/GEO:\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\|(.*)/);
          if (geoMatch) {
            lat = parseFloat(geoMatch[1]);
            lng = parseFloat(geoMatch[2]);
            displayLocation = geoMatch[3].trim();
            console.log(`[proService] Recovered coordinates from location bundle for ${item.name || 'Pro'}: ${lat}, ${lng}`);
          }
        } catch (e) {
          console.error('[proService] Error parsing bundled coordinates:', e);
        }
      }

      return {
        ...item,
        location: displayLocation,
        category: item.profession || item.category, // Map profession to category for frontend compatibility
        image: item.image_url || item.image, // Map image_url or image for frontend compatibility
        bio: item.description || item.bio, // Map description to bio for frontend compatibility
        rating: item.rating ?? 0,
        review_count: item.review_count ?? item.reviews_count ?? 0, // Fallback to 0 if column is missing
        languages: typeof item.languages === 'string' ? JSON.parse(item.languages) : item.languages || [],
        coordinates: (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && (Math.abs(lat) > 0.0001 || Math.abs(lng) > 0.0001)) ? 
          { lat, lng } : null
      };
    });

    console.log('[proService] Mapped data from Supabase:', mappedData);
    return mappedData;
  },

  async createProfessional(pro: any) {
    if (!isSupabaseConfigured) return null;

    // Normalize coordinates and ensure they are numbers
    let lat = typeof pro.lat === 'string' ? parseFloat(pro.lat) : pro.lat;
    let lng = typeof pro.lng === 'string' ? parseFloat(pro.lng) : pro.lng;
    
    // Fallback back to 0 if NaN
    if (isNaN(lat)) lat = 0;
    if (isNaN(lng)) lng = 0;

    // Strip existing GEO: prefix if somehow present
    let cleanLocation = pro.location || '';
    if (typeof cleanLocation === 'string' && cleanLocation.startsWith('GEO:')) {
      const match = cleanLocation.match(/^GEO:[\d.-]+,[\d.-]+\|(.*)$/);
      if (match) cleanLocation = match[1];
    }

    const finalPro: any = {
      name: pro.name,
      company_name: pro.company_name,
      profession: pro.profession || pro.category,
      rating: pro.rating,
      languages: pro.languages,
      image_url: pro.image_url || pro.image,
      description: pro.description || pro.bio,
      phone: pro.phone,
      email: pro.email,
      website: pro.website,
      instagram: pro.instagram,
      facebook: pro.facebook,
      lat: lat,
      lng: lng,
      location: cleanLocation
    };

    // Remove undefined values to avoid Supabase errors
    Object.keys(finalPro).forEach(key => {
      if (finalPro[key] === undefined) {
        delete finalPro[key];
      }
    });

    console.log('[proService] Creating pro with payload:', JSON.stringify(finalPro, null, 2));
    const { data: insertData, error } = await supabase
      .from('professionals')
      .insert([finalPro])
      .select();

    if (error) {
      console.error('Supabase create error:', error);
      throw error;
    }
    return insertData;
  },

  async updateProfessional(id: string | number, pro: any) {
    if (!isSupabaseConfigured) return null;

    console.log('[proService] updateProfessional requested for ID:', id);

    // Normalize ID - only parse as int if it's strictly digit-only
    let finalId = id;
    if (typeof id === 'string' && /^\d+$/.test(id)) {
      finalId = parseInt(id, 10);
      console.log('[proService] Normalized numeric string ID to number:', finalId);
    }

    // Diagnostic: Check auth state
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[proService] Current user:', session?.user?.email || 'Anonymous');

    // Diagnostic: Check if record exists before update and get its current state to see columns
    let existingRecord = null;
    let checkError = null;
    
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', finalId)
        .maybeSingle();
      existingRecord = data;
      checkError = error;
    } catch (e: any) {
      console.error('[proService] Exception during update check:', e);
      if (e.code === '22P02' || (e.message && e.message.includes('bigint'))) {
         return { 
           success: false, 
           message: `Update failed: The ID "${id}" is not compatible with the database bigint type.` 
         };
      }
      throw e;
    }
    
    if (checkError) {
      console.error('[proService] Error fetching existing record:', checkError);
      if (checkError.code === '22P02') {
         return { 
           success: false, 
           message: `Update failed: The ID "${id}" is not compatible with the database bigint type.` 
         };
      }
    }
    
    if (!existingRecord) {
      console.warn('[proService] Record not found in database for ID:', finalId);
      return { 
        success: false, 
        message: `Professional with ID ${finalId} not found. Please refresh the page.` 
      };
    }

    console.log('[proService] Found record. Comparing IDs - Input:', finalId, 'DB:', existingRecord.id);

    // Normalize coordinates
    let lat = typeof pro.lat === 'string' ? parseFloat(pro.lat) : pro.lat;
    let lng = typeof pro.lng === 'string' ? parseFloat(pro.lng) : pro.lng;
    if (isNaN(lat)) lat = 0;
    if (isNaN(lng)) lng = 0;

    // Clean location (remove GEO: prefix if provided in input)
    let cleanLocation = pro.location || '';
    if (typeof cleanLocation === 'string' && cleanLocation.startsWith('GEO:')) {
      const match = cleanLocation.match(/^GEO:[\d.-]+,[\d.-]+\|(.*)$/);
      if (match) cleanLocation = match[1];
    }

    // Build payload dynamically based on existing columns in the table
    // and ONLY include fields that have actually changed to minimize RLS conflicts
    const columns = Object.keys(existingRecord);
    const updatePayload: any = {};
    
    const setIfChanged = (colName: string, newValue: any, existingValue: any) => {
      if (!columns.includes(colName)) return;
      
      // Basic comparison
      let isChanged = false;
      if (Array.isArray(newValue) && Array.isArray(existingValue)) {
        isChanged = JSON.stringify(newValue) !== JSON.stringify(existingValue);
      } else if (typeof newValue === 'number' && typeof existingValue === 'number') {
        isChanged = Math.abs(newValue - existingValue) > 0.000001;
      } else {
        isChanged = String(newValue || '') !== String(existingValue || '');
      }

      if (isChanged) {
        updatePayload[colName] = newValue;
      }
    };

    setIfChanged('name', pro.name, existingRecord.name);
    setIfChanged('company_name', pro.company_name, existingRecord.company_name);
    
    // Profession mapping
    const newProfession = pro.profession || pro.category;
    const existingProfession = existingRecord.profession || existingRecord.category;
    if (columns.includes('profession')) {
      setIfChanged('profession', newProfession, existingRecord.profession);
    } else if (columns.includes('category')) {
      setIfChanged('category', newProfession, existingRecord.category);
    }

    setIfChanged('rating', pro.rating, existingRecord.rating);
    setIfChanged('review_count', pro.review_count || pro.reviews_count, existingRecord.review_count);
    setIfChanged('reviews_count', pro.review_count || pro.reviews_count, existingRecord.reviews_count);
    setIfChanged('languages', Array.isArray(pro.languages) ? pro.languages : [], existingRecord.languages);
    
    // Image mapping
    const newImageUrl = pro.image_url || pro.image;
    if (columns.includes('image_url')) {
      setIfChanged('image_url', newImageUrl, existingRecord.image_url);
    }
    if (columns.includes('image')) {
      setIfChanged('image', newImageUrl, existingRecord.image);
    }
    if (columns.includes('avatar_url')) {
      setIfChanged('avatar_url', newImageUrl, existingRecord.avatar_url);
    }

    // Description/Bio mapping
    const newBio = pro.description || pro.bio;
    if (columns.includes('description')) {
      setIfChanged('description', newBio, existingRecord.description);
    }
    if (columns.includes('bio')) {
      setIfChanged('bio', newBio, existingRecord.bio);
    }

    setIfChanged('phone', pro.phone, existingRecord.phone);
    setIfChanged('email', pro.email, existingRecord.email);
    setIfChanged('website', pro.website, existingRecord.website);
    setIfChanged('instagram', pro.instagram, existingRecord.instagram);
    setIfChanged('facebook', pro.facebook, existingRecord.facebook);
    setIfChanged('lat', lat, existingRecord.lat);
    setIfChanged('lng', lng, existingRecord.lng);
    setIfChanged('location', cleanLocation, existingRecord.location);

    // Remove undefined
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    if (Object.keys(updatePayload).length === 0) {
      console.log('[proService] No fields changed, skipping update call.');
      return { success: true, data: existingRecord };
    }

    console.log('[proService] Executing UPDATE. ID:', finalId, 'Payload:', JSON.stringify(updatePayload, null, 2));
    
    const { data: updateData, error } = await supabase
      .from('professionals')
      .update(updatePayload)
      .eq('id', finalId)
      .select();

    if (error) {
      console.error('[proService] Supabase update ERROR:', error);
      return { success: false, message: `Database error: ${error.message}` };
    }
    
    if (!updateData || updateData.length === 0) {
      console.warn('[proService] UPDATE succeeded but returned no rows. This usually means Row Level Security (RLS) policies are preventing this user from updating this specific record or no fields actually changed.');
      return { 
        success: false, 
        message: 'The update was rejected by the database. This usually happens if you are not logged in as an administrator or do not have permission to modify this record.' 
      };
    }

    console.log('[proService] Update SUCCESS. New data:', updateData[0]);
    return { success: true, data: updateData[0] };
  },

  async deleteProfessional(id: string | number) {
    if (!isSupabaseConfigured) return null;

    console.log('[proService] deleteProfessional requested for ID:', id);

    let finalId = id;
    const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // Check if it's a numeric string and convert to number if it's NOT a UUID
    if (typeof id === 'string' && /^\d+$/.test(id)) {
      finalId = parseInt(id, 10);
      console.log('[proService] Normalized numeric string ID to number:', finalId);
    } else if (isUuid) {
      console.log('[proService] ID is a UUID:', id);
    }

    // 1. Fetch current data for archiving
    // Use a try-catch for the fetch because eq() on bigint with uuid string will throw 22P02
    let proToArchive = null;
    let fetchError = null;

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', finalId)
        .maybeSingle();
      
      proToArchive = data;
      fetchError = error;
    } catch (e: any) {
      console.error('[proService] Exception during fetch for archive:', e);
      // If we got a type mismatch (22P02), it means this ID definitely doesn't exist in the bigint column
      if (e.code === '22P02' || (e.message && e.message.includes('bigint'))) {
         throw new Error(`Deletion failed: The ID "${id}" is a UUID, but the professionals table uses BigInt (numeric) IDs. This professional record cannot be found in the active directory.`);
      }
      throw e;
    }

    if (fetchError) {
      console.error('[proService] Error fetching pro for archive:', fetchError);
      // If it's a type mismatch error (22P02 in Postgres), provide a clearer message
      if (fetchError.code === '22P02' || fetchError.message?.includes('bigint')) {
        throw new Error(`Failed to fetch professional: The ID format "${finalId}" does not match the database type (expected BigInt).`);
      }
      throw new Error(`Failed to fetch professional before deletion: ${fetchError.message}`);
    }

    if (!proToArchive) {
      console.warn('[proService] Professional not found for archiving at ID:', finalId);
    } else {
      console.log('[proService] Archiving pro data...');
      
      // Explicitly pick fields to archive to avoid schema mismatches if the 
      // archive table is missing some secondary columns found in professionals table
      const archiveData: any = {
        name: proToArchive.name,
        company_name: proToArchive.company_name,
        profession: proToArchive.profession || proToArchive.category,
        rating: proToArchive.rating,
        review_count: proToArchive.review_count ?? proToArchive.reviews_count,
        languages: proToArchive.languages,
        image_url: proToArchive.image_url || proToArchive.image,
        description: proToArchive.description || proToArchive.bio,
        phone: proToArchive.phone,
        email: proToArchive.email,
        website: proToArchive.website,
        instagram: proToArchive.instagram,
        facebook: proToArchive.facebook,
        location: proToArchive.location,
        lat: proToArchive.lat,
        lng: proToArchive.lng,
        created_at: proToArchive.created_at,
        original_id: String(proToArchive.id), // Ensure it's a string
        deleted_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(archiveData).forEach(key => {
        if (archiveData[key] === undefined) delete archiveData[key];
      });
      
      const { error: archiveError } = await supabase
        .from('deleted_professionals')
        .insert([archiveData]);

      if (archiveError) {
        console.error('[proService] Archiving failed:', archiveError);
        // If it's a "column not found" error, we might want to warn specifically
        if (archiveError.message?.includes('column')) {
            throw new Error(`Archiving failed: ${archiveError.message}. Make sure your 'deleted_professionals' table has all the required columns (name, description, image_url, etc.).`);
        }
        throw new Error(`Archiving failed: ${archiveError.message}. Deletion aborted.`);
      }
      console.log('[proService] Archiving successful.');
    }

    // 3. Delete from original table
    try {
      const { error: deleteError } = await supabase
        .from('professionals')
        .delete()
        .eq('id', finalId);

      if (deleteError) {
        console.error('[proService] Supabase delete ERROR:', deleteError);
        if (deleteError.code === '22P02' || deleteError.message?.includes('bigint')) {
          throw new Error(`Deletion failed: The professional was successfully archived to 'deleted_professionals', but cannot be deleted from the active directory. This happens because of a trigger or constraint check comparing this UUID ID "${finalId}" to a BigInt column (such as 'testimonies.pro_id'). Please alter your relations/triggers in Supabase SQL Editor.`);
        }
        throw new Error(`Deletion failed: ${deleteError.message}`);
      }
    } catch (e: any) {
      if (e.code === '22P02' || (e.message && e.message.includes('bigint'))) {
        throw new Error(`Deletion failed: The professional was successfully archived to 'deleted_professionals', but cannot be deleted from the active directory. This happens because of a trigger or constraint check comparing this UUID ID "${finalId}" to a BigInt column (such as 'testimonies.pro_id'). Please alter your relations/triggers in Supabase SQL Editor.`);
      }
      throw e;
    }
    
    console.log('[proService] Deletion successful for ID:', finalId);
    return { success: true };
  },

  async submitRecommendation(recommendation: {
    user_email: string;
    pro_name?: string;
    company_name?: string;
    pro_category: string;
    pro_email?: string;
    pro_phone?: string;
    pro_image_url?: string;
    notes: string;
  }) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('recommendations')
      .insert([recommendation]);

    if (error) throw error;
    return data;
  },

  async getRecommendations() {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addTestimony(testimony: {
    pro_id: string | number;
    author: string;
    rating: number;
    comment: string;
  }) {
    if (!isSupabaseConfigured) return null;

    // Check if user already reviewed this pro
    const hasReviewed = await this.hasUserReviewedPro(testimony.author, testimony.pro_id);
    if (hasReviewed) {
      throw new Error('You have already submitted a testimonial for this professional.');
    }

    const payload = {
      pro_id: testimony.pro_id, // Pass as is, Supabase handles string to uuid casting if format is correct
      author: testimony.author,
      rating: testimony.rating,
      comment: testimony.comment,
      status: 'pending' // Default to pending for moderation
    };

    const { data, error } = await supabase
      .from('testimonies')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error adding testimony:', error);
      throw error;
    }

    return data;
  },

  async hasUserReviewedPro(authorName: string, proId: string | number) {
    if (!isSupabaseConfigured) return false;

    const { data, error } = await supabase
      .from('testimonies')
      .select('id')
      .eq('author', authorName)
      .eq('pro_id', proId)
      .maybeSingle();

    if (error) {
      console.error('Error checking existing testimony:', error);
      return false;
    }

    return !!data;
  },

  async syncProfessionalStats(proId: string | number) {
    if (!isSupabaseConfigured) return;

    let finalProId = proId;
    if (typeof proId === 'string' && /^\d+$/.test(proId)) {
      finalProId = parseInt(proId, 10);
    }

    console.log('[proService] Recalculating stats for professional ID:', finalProId);

    // 1. Fetch all approved testimonies for this pro
    const { data: approvedTestimonies, error: fetchError } = await supabase
      .from('testimonies')
      .select('rating')
      .eq('pro_id', finalProId)
      .eq('status', 'approved');

    if (fetchError) {
      console.error('[proService] Error fetching testimonies for stats sync:', fetchError);
      return;
    }

    // 2. Calculate new stats
    const newCount = approvedTestimonies?.length || 0;
    let newRating = 0;
    if (newCount > 0) {
      const sum = approvedTestimonies.reduce((acc, curr) => acc + (curr.rating || 0), 0);
      newRating = Number((sum / newCount).toFixed(1));
    }

    // 3. Update professional record
    // We check which columns exist to avoid errors
    const { data: proData } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', finalProId)
      .maybeSingle();

    if (!proData) return;

    const updates: any = { rating: newRating };
    if ('review_count' in proData) updates.review_count = newCount;
    if ('reviews_count' in proData) updates.reviews_count = newCount;

    console.log('[proService] Applying recalculated stats:', updates);
    const { error: updateError } = await supabase
      .from('professionals')
      .update(updates)
      .eq('id', finalProId);

    if (updateError) {
      console.error('[proService] Error updating pro stats during sync:', updateError);
    }
  },

  async approveTestimony(id: string | number) {
    if (!isSupabaseConfigured) return null;

    console.log('[proService] Approving testimony:', id);

    let finalId = id;
    if (typeof id === 'string' && /^\d+$/.test(id)) {
      finalId = parseInt(id, 10);
    }

    const { data: updateData, error: updateError, status } = await supabase
      .from('testimonies')
      .update({ status: 'approved', refusal_reason: null })
      .eq('id', finalId)
      .select();

    console.log('[proService] Approve UPDATE status:', status, 'Data returned:', updateData, 'Error:', updateError);

    if (updateError) {
      console.error('Error approving testimony:', updateError);
      throw updateError;
    }

    if (!updateData || updateData.length === 0) {
      console.warn('[proService] No rows updated in approveTestimony for ID:', finalId);
      throw new Error('Testimony not found or no permission to update');
    }

    const testimonyData = updateData[0];
    console.log('[proService] Testimony state after approval:', testimonyData);

    // Sync stats
    await this.syncProfessionalStats(testimonyData.pro_id);

    return testimonyData;
  },

  async refuseTestimony(id: string | number, reason: string) {
    if (!isSupabaseConfigured) return null;

    console.log('[proService] Refusing testimony:', id, 'Reason:', reason);

    let finalId = id;
    if (typeof id === 'string' && /^\d+$/.test(id)) {
      finalId = parseInt(id, 10);
    }

    const { data, error, status } = await supabase
      .from('testimonies')
      .update({ status: 'refused', refusal_reason: reason })
      .eq('id', finalId)
      .select();

    console.log('[proService] Refuse UPDATE status:', status, 'Data returned:', data, 'Error:', error);

    if (error) {
      console.error('Error refusing testimony:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('[proService] No rows updated in refuseTestimony for ID:', finalId);
      throw new Error('Testimony not found or no permission to update');
    }
    
    // Sync stats in case it was previously approved
    await this.syncProfessionalStats(data[0].pro_id);
    
    return data[0];
  },

  async getTestimonies(proId: string | number) {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('testimonies')
      .select('*')
      .eq('pro_id', proId)
      .eq('status', 'approved') // Only return approved testimonies publicly
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching testimonies:', error);
      return [];
    }
    return data;
  },

  async getAllTestimonies() {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('testimonies')
      .select('*, professionals(name, company_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching all testimonies:', error);
      return [];
    }
    return data;
  },

  async getMyTestimonies(authorName: string) {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('testimonies')
      .select('*')
      .eq('author', authorName)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching my testimonies:', error);
      return [];
    }
    return data;
  },

  async updateTestimony(id: string | number, rating: number, comment: string) {
    if (!isSupabaseConfigured) return null;

    let finalId = id;
    if (typeof id === 'string' && /^\d+$/.test(id)) {
      finalId = parseInt(id, 10);
    }

    // 1. Get current testimony to check status and pro_id
    const { data: currentTestimony, error: fetchError } = await supabase
      .from('testimonies')
      .select('*')
      .eq('id', finalId)
      .maybeSingle();

    if (fetchError || !currentTestimony) {
      console.error('Error fetching testimony for update:', fetchError);
      throw new Error('Testimony not found');
    }

    // 2. Update the testimony to pending
    const { data, error } = await supabase
      .from('testimonies')
      .update({ 
        rating, 
        comment, 
        status: 'pending',
        refusal_reason: null
      })
      .eq('id', finalId)
      .select();

    if (error) {
      console.error('Error updating testimony:', error);
      throw error;
    }

    // 3. Recalculate stats for the pro
    await this.syncProfessionalStats(currentTestimony.pro_id);

    return data;
  },

  async deleteTestimony(id: string | number) {
    if (!isSupabaseConfigured) return false;

    let finalId = id;
    if (typeof id === 'string' && /^\d+$/.test(id)) {
      finalId = parseInt(id, 10);
    }

    // Fetch the testimony first to check its status and pro_id (for stats update)
    let testimonyData = null;
    try {
      const { data, error: fetchError } = await supabase
        .from('testimonies')
        .select('*')
        .eq('id', finalId)
        .maybeSingle(); // Use maybeSingle to avoid error if not found

      if (!fetchError) {
        testimonyData = data;
      }
    } catch (e) {
      console.warn('Error fetching testimony before deletion:', e);
    }

    const { error: deleteError } = await supabase
      .from('testimonies')
      .delete()
      .eq('id', finalId);

    if (deleteError) {
      console.error('Error deleting testimony:', deleteError);
      throw deleteError;
    }

    // Recalculate stats for the pro
    if (testimonyData) {
      await this.syncProfessionalStats(testimonyData.pro_id);
    }

    return true;
  },

  async updateRecommendationStatus(id: string, status: 'pending' | 'validated' | 'refused', adminNotes?: string | null) {
    if (!isSupabaseConfigured) return null;

    const updatePayload: any = { status };
    if (adminNotes !== undefined) {
      updatePayload.admin_notes = adminNotes;
    } else if (status === 'pending' || status === 'validated') {
      // Clear notes when moving away from refused status unless specifically provided
      updatePayload.admin_notes = null;
    }

    const { data, error } = await supabase
      .from('recommendations')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error(`No recommendation found with ID: ${id}`);
    }

    return data;
  }
};
