import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Conversation {
  id: string;
  created_at: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  is_blocked?: boolean;
  otherUser?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    email?: string;
    bio?: string;
    chat_enabled?: boolean;
  };
}

export interface Message {
  id: string;
  created_at: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read?: boolean;
}

export interface UserReport {
  id?: string;
  created_at?: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string;
  conversation_id?: string;
  resolved?: boolean;
}

export interface UserBlock {
  id?: string;
  created_at?: string;
  blocker_id: string;
  blocked_id: string;
}

export const chatService = {
  // Retrieve or create a conversation between two users
  async getOrCreateConversation(user1Id: string, user2Id: string) {
    if (!isSupabaseConfigured) return null;

    // Security: Check if either participant has blocked the other before starting/getting
    try {
      // Robust bidirectional check using two queries (safer than complex nested or)
      const [{ data: blocks1 }, { data: blocks2 }] = await Promise.all([
        supabase.from('user_blocks').select('id').eq('blocker_id', user1Id).eq('blocked_id', user2Id).maybeSingle(),
        supabase.from('user_blocks').select('id').eq('blocker_id', user2Id).eq('blocked_id', user1Id).maybeSingle()
      ]);

      if (blocks1 || blocks2) {
        throw new Error('This discussion is blocked.');
      }
    } catch (e: any) {
      if (e.message === 'This discussion is blocked.') throw e;
      console.warn('Block check in getOrCreateConversation failed:', e);
    }

    // Check if a conversation already exists (either way)
    try {
      console.log(`Checking for existing conversation between ${user1Id} and ${user2Id}...`);
      const { data: convs, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user1Id},participant_2.eq.${user1Id}`);

      if (searchError) {
        console.error('SEARCH ERROR in getOrCreateConversation:', searchError);
        throw new Error(`Database error (Search): ${searchError.message} - Code: ${searchError.code}`);
      }

      const existing = (convs || []).find(c => 
        (c.participant_1 === user1Id && c.participant_2 === user2Id) || 
        (c.participant_1 === user2Id && c.participant_2 === user1Id)
      );

      if (existing) {
        console.log('Existing conversation found:', existing.id);
        return existing as Conversation;
      }

      // Otherwise, create it
      console.log('No existing conversation found. Creating new one...');
      const { data: created, error: createError } = await supabase
        .from('conversations')
        .insert([
          { participant_1: user1Id, participant_2: user2Id, last_message_at: new Date().toISOString() }
        ])
        .select()
        .maybeSingle();

      if (createError) {
        console.error('CREATE ERROR in getOrCreateConversation:', createError);
        throw new Error(`Database error (Create): ${createError.message} - Code: ${createError.code}`);
      }

      if (!created) {
        console.warn('Conversation insertion returned no data.');
        // Try fallback fetch in case insert succeeded but select failed due to RLS
        const { data: fallback } = await supabase
          .from('conversations')
          .select('*')
          .or(`participant_1.eq.${user1Id},participant_2.eq.${user1Id}`);
        
        const retryMatch = (fallback || []).find(c => 
          (c.participant_1 === user1Id && c.participant_2 === user2Id) || 
          (c.participant_1 === user2Id && c.participant_2 === user1Id)
        );
        if (retryMatch) return retryMatch as Conversation;
      }

      console.log('New conversation created:', created?.id);
      return created as Conversation;
    } catch (err: any) {
      console.error('CRITICAL ERROR in getOrCreateConversation:', err);
      throw err;
    }
  },

  // Retrieve user's conversations with participant profiles
  async getUserConversations(userId: string) {
    if (!isSupabaseConfigured) return [];
    
    try {
      console.log(`Fetching conversations for user: ${userId}`);
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('last_message_at', { ascending: false });
        
      if (error) {
        console.error('FETCH CONVERSATIONS ERROR:', error);
        throw error;
      }
      
      console.log(`Found ${conversations?.length || 0} conversations`);
      if (!conversations || conversations.length === 0) return [];
      
      // Collect unique IDs of all participants
      const participantIds = Array.from(new Set(
        conversations.map(c => c.participant_1 === userId ? c.participant_2 : c.participant_1)
      ));
      
      if (participantIds.length === 0) return [];

      // Fetch their profiles
      console.log(`Fetching ${participantIds.length} profiles for participants...`);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', participantIds);
        
      if (profilesError) {
        console.error('Error fetching participant profiles:', profilesError);
      }
      
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      
      // Match conversations with profiles
      return conversations.map(c => {
        const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
        const otherProfile = profileMap.get(otherId);
        return {
          ...c,
          otherUser: otherProfile || { id: otherId, full_name: 'Unknown Member', email: '' }
        };
      }) as Conversation[];
    } catch (err) {
      console.error('CRITICAL ERROR in getUserConversations:', err);
      throw err;
    }
  },

  // Retrieve message log of a conversation
  async getMessages(conversationId: string) {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
  },

  // Mark messages in a conversation as read in the database
  async markMessagesAsRead(conversationId: string, userId: string) {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .or(`and(receiver_id.eq.${userId},sender_id.neq.${userId}),and(receiver_id.is.null,sender_id.neq.${userId})`);

      if (error) {
        console.warn('Error marking messages as read in Supabase:', error);
      }
    } catch (e) {
      console.warn('Failed to update is_read in Supabase:', e);
    }
  },

  // Send a message
  async sendMessage(conversationId: string, senderId: string, content: string) {
    if (!isSupabaseConfigured) return null;

    // Security: Check if conversation is blocked or users have blocked each other
    let otherId = '';
    try {
      const { data: conv } = await supabase
        .from('conversations')
        .select('participant_1, participant_2, is_blocked')
        .eq('id', conversationId)
        .single();

      if (conv) {
        if (conv.is_blocked) {
          throw new Error('This conversation is blocked.');
        }

        otherId = conv.participant_1 === senderId ? conv.participant_2 : conv.participant_1;
        
        // Final secure bidirectional check
        const [
          { data: blocks1 }, 
          { data: blocks2 },
          { data: senderProfile, error: senderError },
          { data: receiverProfile, error: receiverError }
        ] = await Promise.all([
          supabase.from('user_blocks').select('id').eq('blocker_id', senderId).eq('blocked_id', otherId).maybeSingle(),
          supabase.from('user_blocks').select('id').eq('blocker_id', otherId).eq('blocked_id', senderId).maybeSingle(),
          supabase.from('profiles').select('chat_enabled').eq('id', senderId).maybeSingle(),
          supabase.from('profiles').select('chat_enabled').eq('id', otherId).maybeSingle()
        ]);

        if (blocks1 || blocks2) {
          throw new Error('This discussion is blocked.');
        }

        // Gracefully handle if chat_enabled column does not exist yet (backend migration pending)
        const senderChatEnabled = senderError?.code === '42703' ? true : (senderProfile?.chat_enabled ?? true);
        const receiverChatEnabled = receiverError?.code === '42703' ? true : (receiverProfile?.chat_enabled ?? true);

        if (senderChatEnabled === false || receiverChatEnabled === false) {
          throw new Error('Chat participation is disabled for one of the users.');
        }
      }
    } catch (e: any) {
      if (e.message === 'This conversation is blocked.' || e.message === 'This discussion is blocked.') throw e;
      console.warn('Block check failed, proceeding with caution:', e);
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        { conversation_id: conversationId, sender_id: senderId, receiver_id: otherId, content, is_read: false }
      ])
      .select()
      .single();

    if (error) throw error;

    // Update last_message_at for the conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data as Message;
  },

  // Subscribe to new messages in real-time
  subscribeToMessages(
    conversationId: string, 
    onNewMessage: (message: Message) => void,
    onUpdateMessage?: (message: Message) => void
  ) {
    if (!isSupabaseConfigured) return () => {};

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          onNewMessage(payload.new as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (onUpdateMessage) {
            onUpdateMessage(payload.new as Message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Report a member
  async reportUser(report: UserReport) {
    if (!isSupabaseConfigured) return null;

    const { error } = await supabase
      .from('user_reports')
      .insert([report]);

    if (error) throw error;
    return { success: true };
  },

  async getAllReports() {
    if (!isSupabaseConfigured) return [];
    try {
      const { data: reports, error } = await supabase
        .from('user_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching user_reports:', error);
        throw error;
      }
      if (!reports || reports.length === 0) return [];

      // Local storage fallback for resolved statuses
      let resolvedLocalIds: string[] = [];
      try {
        const stored = localStorage.getItem('supabase_resolved_reports');
        if (stored) {
          resolvedLocalIds = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading resolved reports from localStorage:', e);
      }

      // Extract only the IDs of profiles involved in these reports
      const profileIds = Array.from(new Set([
        ...reports.map(r => r.reporter_id),
        ...reports.map(r => r.reported_id)
      ].filter(Boolean)));

      const profileMap = new Map();
      if (profileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', profileIds);

        if (profilesError) {
          console.warn('Could not fetch profiles for reports:', profilesError);
        } else if (profiles) {
          profiles.forEach(p => {
            profileMap.set(p.id, p);
          });
        }
      }

      return reports.map(r => ({
        ...r,
        resolved: r.resolved === true || r.resolved === 'true' || resolvedLocalIds.includes(String(r.id)),
        reporter: profileMap.get(r.reporter_id) || { id: r.reporter_id, full_name: 'Unknown User' },
        reported: profileMap.get(r.reported_id) || { id: r.reported_id, full_name: 'Unknown User' }
      }));
    } catch (err) {
      console.error('Error fetching user reports:', err);
      return [];
    }
  },

  async resolveReport(reportId: string | number) {
    // Save to local storage as fallback immediately
    try {
      const stored = localStorage.getItem('supabase_resolved_reports');
      const resolvedLocalIds: string[] = stored ? JSON.parse(stored) : [];
      if (!resolvedLocalIds.includes(String(reportId))) {
        resolvedLocalIds.push(String(reportId));
        localStorage.setItem('supabase_resolved_reports', JSON.stringify(resolvedLocalIds));
      }
    } catch (e) {
      console.error('Error writing resolved reports to localStorage:', e);
    }

    if (!isSupabaseConfigured) return { success: true };
    try {
      // Robust handling of both integer or UUID column types
      let parsedId: any = reportId;
      if (typeof reportId === 'string' && /^\d+$/.test(reportId)) {
        parsedId = parseInt(reportId, 10);
      }

      // First try with parsed integer/original type
      const { error } = await supabase
        .from('user_reports')
        .update({ resolved: true })
        .eq('id', parsedId);
      
      // If we got an error and the original query parameter was converted to integer, fallback to original string type
      if (error && parsedId !== reportId) {
        const { error: fallbackError } = await supabase
          .from('user_reports')
          .update({ resolved: true })
          .eq('id', reportId);
        if (fallbackError) throw fallbackError;
      } else if (error) {
        throw error;
      }
      return { success: true };
    } catch (err) {
      console.warn('Supabase resolveReport query failed (this is expected if the resolved column does not exist yet):', err);
      // We return success: true so the front-end treats it as resolved locally instead of showing an error
      return { success: true, localOnly: true };
    }
  },

  async deleteReport(reportId: string | number) {
    if (!isSupabaseConfigured) return { success: false };
    try {
      const { error } = await supabase
        .from('user_reports')
        .delete()
        .eq('id', reportId);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error deleting report:', err);
      throw err;
    }
  },

  // Block a conversation
  async blockConversation(conversationId: string) {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase
      .from('conversations')
      .update({ is_blocked: true })
      .eq('id', conversationId);
    if (error) throw error;
    return true;
  },

  // Unblock a conversation
  async unblockConversation(conversationId: string, userId: string) {
    if (!isSupabaseConfigured) return false;
    
    // 1. Get the participants to identify the other user
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant_1, participant_2')
      .eq('id', conversationId)
      .single();
      
    if (!conv) return false;
    const otherUserId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;

    // 2. Check if the other user has also blocked the current user
    const { data: otherBlock } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', otherUserId)
      .eq('blocked_id', userId)
      .maybeSingle();

    // If the other person still has this user blocked, we cannot reveal the conversation yet
    if (otherBlock) {
      console.log(`[ChatService] Cannot unblock conversation ${conversationId} globally because the other participant (${otherUserId}) still has a block active.`);
      return false;
    }

    // 3. Otherwise, set conversation as no longer blocked
    const { error } = await supabase
      .from('conversations')
      .update({ is_blocked: false })
      .eq('id', conversationId);
    if (error) throw error;
    return true;
  },

  // Delete conversation if it has no messages
  async deleteConversationIfEmpty(conversationId: string) {
    if (!isSupabaseConfigured) return false;
    
    try {
      // Check if there are any messages - simple select first message
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .limit(1);

      if (fetchError) throw fetchError;

      // If no messages found, delete the conversation
      if (!data || data.length === 0) {
        console.log(`[ChatService] Conversation ${conversationId} is empty. Deleting...`);
        
        // Try deleting. If it fails due to RLS, it might stay there, but we try our best.
        const { error: deleteError } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId);
        
        if (deleteError) {
          console.warn(`[ChatService] Failed to delete empty conversation ${conversationId}:`, deleteError.message);
          return false;
        }
        
        console.log(`[ChatService] Successfully deleted empty conversation ${conversationId}`);
        return true; 
      }
      return false; 
    } catch (err) {
      console.error('[ChatService] Error in deleteConversationIfEmpty:', err);
      return false;
    }
  },

  // Block a member
  async blockUser(blockerId: string, blockedId: string) {
    if (!isSupabaseConfigured) return null;

    // Check if the block already exists
    const { data: existing } = await supabase
      .from('user_blocks')
      .select('*')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await supabase
        .from('user_blocks')
        .insert([{ blocker_id: blockerId, blocked_id: blockedId }])
        .select()
        .single();

      if (error) throw error;
    }

    // Block all conversations between these two
    await supabase
      .from('conversations')
      .update({ is_blocked: true })
      .or(`and(participant_1.eq.${blockerId},participant_2.eq.${blockedId}),and(participant_1.eq.${blockedId},participant_2.eq.${blockerId})`);

    return { success: true };
  },

  // Unblock a member
  async unblockUser(blockerId: string, blockedId: string) {
    if (!isSupabaseConfigured) return false;

    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) throw error;
    return true;
  },

  // Retrieve the list of blocked user IDs
  async getBlockedUsers(blockerId: string) {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', blockerId);

    if (error) throw error;
    return (data || []).map(item => item.blocked_id) as string[];
  },

  // Retrieve list of users who blocked this user
  async getUsersWhoBlockedMe(userId: string) {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocker_id')
      .eq('blocked_id', userId);

    if (error) throw error;
    return (data || []).map(item => item.blocker_id) as string[];
  },

  // Fetch user profile by complete name (linking review triggers)
  async getProfileByName(name: string) {
    if (!isSupabaseConfigured || !name) return null;

    const normalized = name.trim().toLowerCase();

    // 1. Try exact match on full_name
    try {
      const { data: exactFull } = await supabase
        .from('profiles')
        .select('*')
        .eq('full_name', name)
        .maybeSingle();

      if (exactFull) return exactFull;
    } catch (e) {
      console.warn('Error on exact full name search:', e);
    }

    // 2. Try exact match on email
    try {
      const { data: exactEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', name)
        .maybeSingle();

      if (exactEmail) return exactEmail;
    } catch (e) {
      console.warn('Error on exact email search:', e);
    }

    // 3. Try case-insensitive matching on full_name
    try {
      const { data: ilikeFull } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', name)
        .maybeSingle();

      if (ilikeFull) return ilikeFull;
    } catch (e) {
      console.warn('Error on ILIKE full name search:', e);
    }

    // 4. Try case-insensitive matching on email
    try {
      const { data: ilikeEmail } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', name)
        .maybeSingle();

      if (ilikeEmail) return ilikeEmail;
    } catch (e) {
      console.warn('Error on ILIKE email search:', e);
    }

    // 5. Try case-insensitive partial match on email (e.g., local part like "vincentdurroux" matching "vincentdurroux@gmail.com")
    try {
      const { data: partialEmail } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', `%${normalized}%`);

      if (partialEmail && partialEmail.length > 0) {
        return partialEmail[0];
      }
    } catch (e) {
      console.warn('Error on partial email search:', e);
    }

    // 6. Try case-insensitive partial match on full_name (e.g., "Vincent" matching "Vincent Durroux")
    try {
      const { data: partialFull } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${normalized}%`);

      if (partialFull && partialFull.length > 0) {
        return partialFull[0];
      }
    } catch (e) {
      console.warn('Error on partial full_name search:', e);
    }

    // 7. Client-side comparison matching email local parts, approximate names, etc.
    try {
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*');

      if (allProfiles && allProfiles.length > 0) {
        const found = allProfiles.find(p => {
          const pFullName = (p.full_name || '').trim().toLowerCase();
          const pEmail = (p.email || '').trim().toLowerCase();
          const pEmailLocalPart = pEmail.split('@')[0];

          return pFullName === normalized ||
                 pEmailLocalPart === normalized ||
                 pEmail === normalized ||
                 normalized.includes(pFullName) ||
                 pFullName.includes(normalized) ||
                 pEmailLocalPart.includes(normalized) ||
                 normalized.includes(pEmailLocalPart);
        });

        if (found) return found;
      }
    } catch (e) {
      console.warn('Error on comprehensive fallback profiles fetch:', e);
    }

    return null;
  }
};
