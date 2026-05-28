import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface GuideArticle {
  id: string;
  title: string;
  excerpt: string;
  tag?: string;
  content?: string;
  imageUrl?: string;
  businessName?: string;
  author?: {
    name: string;
    role?: string;
    businessName?: string;
    avatarUrl?: string;
    website?: string;
    email?: string;
    phone?: string;
  };
}

export interface GuideCategory {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  color: string;
  articles: GuideArticle[];
}

// SQL TO CREATE THE TABLES IN SUPABASE (without read_time):
// 
// drop table if exists guide_articles;
// drop table if exists guide_categories;
// 
// create table guide_categories (
//   id text primary key,
//   title text not null,
//   description text not null,
//   icon_name text not null,
//   color text not null,
//   created_at timestamp with time zone default timezone('utc'::text, now()) not null
// );
// 
// create table guide_articles (
//   id text primary key,
//   category_id text not null references guide_categories(id) on delete cascade,
//   title text not null,
//   excerpt text not null,
//   tag text,
//   content text,
//   image_url text,
//   business_name text,
//   author jsonb,
//   created_at timestamp with time zone default timezone('utc'::text, now()) not null
// );
// 
// -- Enable RLS
// alter table guide_categories enable row level security;
// alter table guide_articles enable row level security;
// 
// -- Allow public read access
// create policy "Allow public read access on guide_categories" on guide_categories for select using (true);
// create policy "Allow public read access on guide_articles" on guide_articles for select using (true);
// 
// -- Allow write access (for administrative seeding/updating)
// create policy "Allow all actions for admin on categories" on guide_categories for all using (true);
// create policy "Allow all actions for admin on articles" on guide_articles for all using (true);

export const MOCK_GUIDE_CATEGORIES_DATA = [
  { 
    id: 'getting-started', 
    title: 'Getting Started', 
    description: 'First steps for your arrival in Valencia.', 
    icon_name: 'RocketIcon',
    color: 'bg-orange-500',
    articles: [
      { 
        id: 'gs-1', 
        title: 'Top 10 Neighborhoods for Expats', 
        excerpt: 'From trendy Ruzafa to family-friendly El Carmen.', 
        tag: 'Housing',
        imageUrl: 'https://images.unsplash.com/photo-1549880181-56a44cf4a9a1?auto=format&fit=crop&w=1200&q=80',
        content: "Choosing the right neighborhood in Valencia is the most critical decision for your quality of life. Ruzafa is popular with young professionals and digital nomads due to its boho charm and active coffee culture. Cabañal offers coastal vibes, historic fisherman's cottages, and direct access to Malvarrosa beach.\n\nFamilies often prefer the quiet, green surroundings of Campanar or Benimaclet, which offer fantastic parks and excellent local feel.",
        author: { 
          name: "Marina Sanchis", 
          role: "Valencia Neighborhood & Real Estate Advisor", 
          businessName: "Engel & Völkers Valencia",
          website: "https://www.engelvoelkers.com/valencia", 
          email: "marina.sanchis@ev.com", 
          phone: "+34 612 345 678" 
        }
      },
      { 
        id: 'gs-2', 
        title: 'Arrival Checklist: First 48 Hours', 
        excerpt: 'SIM cards, transport cards, and essential apps.', 
        tag: 'Essentials',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
        content: "When you touch down in Valencia, getting connected is priority number one. Head to a local phone shop (such as Vodafone, Movistar, or Orange) with your passport to purchase a prepaid SIM card.\n\nNext, purchase a 'TuiN' or multi-trip card at any metro station for cost-effective transit on public buses and metro lines. Make sure to download local lifesaver apps: Valenbisi (bike-sharing), EMT Valencia (bus tracking), and Cabify or FreeNow for easy taxi booking."
      },
      { 
        id: 'gs-3', 
        title: 'How to use the Metro & Valenbisi', 
        excerpt: 'Navigating the city like a local.', 
        tag: 'Transport',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        content: "Valencia is highly walkable, but its public transportation system is top-notch. Metrovalencia links the airport directly to the city center and the beaches via lines 3, 5, and 9.\n\nFor eco-friendly travel, the Valenbisi bike network has hundreds of stations across the city. You can purchase an annual or weekly pass on their website or directly at major stations. It is inexpensive, healthy, and lets you enjoy our 300+ days of annual Spain sunshine."
      }
    ]
  },
  { 
    id: 'paperwork', 
    title: 'Paperwork Survival', 
    description: 'NIE, Empadronamiento, and legal essentials.', 
    icon_name: 'PaperworkIcon',
    color: 'bg-blue-500',
    articles: [
      { 
        id: 'pw-1', 
        title: 'The Ultimate NIE Guide 2024', 
        excerpt: 'How to get your appointment without losing your mind.', 
        tag: 'Legal',
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
        content: "Securing a NIE (Número de Identidad de Extranjero) is essential for renting long-term apartments, opening a Spanish bank account, or getting an employment contract.\n\nThe trickiest part is booking the appointment ('Cita Previa') online through the government portal. Refresh the page early on Monday mornings when new slots open! Be sure to bring standard copies of your passport, EX-15 or EX-18 application forms, and proof of why you need the NIE (such as a job offer or property buying agreement).",
        author: { 
          name: "Alejandro Ruiz", 
          role: "Expat Legal Counsel & Immigration Lawyer", 
          businessName: "Valencia Legal Services",
          website: "https://www.valencialegal.com", 
          email: "contact@valencialegal.com", 
          phone: "+34 960 123 456" 
        }
      },
      { 
        id: 'pw-2', 
        title: 'Empadronamiento Explained', 
        excerpt: 'Why you need it and how to register at the Ayuntamiento.', 
        tag: 'Legal',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
        content: "The 'Padrón' is the official database containing the names of all residents in a municipality. Registering your address at the local town hall ('Ayuntamiento') is called the 'empadronamiento'.\n\nIt is legal proof of your residence in Spain, essential for accessing public healthcare, registering children for school, or buying a vehicle. You will need your rental contract in Spain, utility bills, and your passport or NIE to complete the registration successfully."
      },
      { 
        id: 'pw-3', 
        title: 'Digital Certificate: Your Best Friend', 
        excerpt: 'How to do all your paperwork online from home.', 
        tag: 'Tech',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        content: "Once you have your Spanish NIE, the single best tech upgrade you can make is getting a 'Certificado Digital' (Digital Certificate). Official issuance through the FNMT website allows you to authenticate your identity instantly across all Spanish government portals.\n\nYou can submit taxes, request renewal documents, view school applications, and verify medical records from the comfort of your living room sofa with zero standing in long queues."
      }
    ]
  },
  { 
    id: 'family', 
    title: 'Family Life', 
    description: 'Schools, activities, and family services.', 
    icon_name: 'FamilyIcon',
    color: 'bg-pink-500',
    articles: [
      { 
        id: 'fm-1', 
        title: 'Public vs. Concertado vs. Private Schools', 
        excerpt: 'Understanding the Spanish education system.', 
        tag: 'Education',
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
        content: "Valencia offers excellent schools across three categories: Public schools (free, local curriculum taught mostly in Valenciano and Spanish), Concertado schools (semi-private, heavily subsidized with small fees), and Private schools (covering British, American, or international curriculums and taught in English).\n\nChoose public schools for rapid language immersion, or international private academies if you want consistent international pathways for older children.",
        author: { 
          name: "Claire Dubois", 
          role: "Bilingual Expat Family Liaison", 
          businessName: "Valencia Family Liaison",
          website: "https://www.valenciafamilies.com", 
          email: "claire@valenciafamilies.com", 
          phone: "+34 689 987 654" 
        }
      },
      { 
        id: 'fm-2', 
        title: 'Best Parks & Playgrounds in Valencia', 
        excerpt: 'Where to take the kids on a sunny afternoon.', 
        tag: 'Leisure',
        imageUrl: 'https://images.unsplash.com/photo-1542037104857-ffbc0b212989?auto=format&fit=crop&w=1200&q=80',
        content: "The Turia Gardens (Jardín del Turia) are a kid's dream! Spanning 9 kilometers wrapped around the city center, it features play areas, zip-lines, and the legendary Gulliver Giant park (where kids can slide down a massive giant statue's hair and clothes).\n\nFor weekend trips outside the park, head to the Valencia Cabecera park which has swan pedal boats, or the Bioparc zoo, ranking as one of the best immersion nature preserves in Europe."
      },
      { 
        id: 'fm-3', 
        title: 'Finding a Reliable Nanny or Babysitter', 
        excerpt: 'Trusted services and community recommendations.', 
        tag: 'Services',
        imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80',
        content: "Reliable childcare makes setting up life in a new country so much smoother. Valencia has a thriving community of bilingual expat nannies, university students, and babysitters.\n\nTop service apps such as Sitly and Babysits have localized directories with reviews and background checks. You can also ask on active local Facebook channels like 'Moms in Valencia' or 'Expat Parents Valencia' to find trusted contacts with amazing recommendations."
      }
    ]
  },
  { 
    id: 'health', 
    title: 'Stay Healthy', 
    description: 'Doctors, hospitals, and wellness tips.', 
    icon_name: 'HealthIcon',
    color: 'bg-emerald-500',
    articles: [
      { 
        id: 'hl-1', 
        title: 'How to Register for Public Healthcare', 
        excerpt: 'Getting your SIP card as an expat.', 
        tag: 'Health',
        imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
        content: "Expats who are registered as 'autónomo', employed, or pensioners in Spain have full right to use the public health system.\n\nTo register, take your employment contract or proof of social security registration, your empadronamiento, and passport to your nearest neighborhood primary care center ('Centro de Salud'). They will register you on the state system and print out your physical SIP medical card, which is used for doctor visits and discounted medication at local pharmacies.",
        author: { 
          name: "Dr. Sarah Miller", 
          role: "International Medical Coordinator", 
          businessName: "Hospital Salud Valencia",
          website: "https://www.hospitalsalud.es", 
          email: "s.miller@hospitalsalud.es", 
          phone: "+34 963 888 999" 
        }
      },
      { 
        id: 'hl-2', 
        title: 'Best English-Speaking Doctors', 
        excerpt: 'A curated list of trusted medical professionals.', 
        tag: 'Directory',
        imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80',
        content: "Communicating your symptoms clearly is everything when you are unwell. Private practices such as those at IMED Valencia or Hospital Quirónsalud have dedicated international care desks with bilingual receptionists and English-fluent general practitioners.\n\nFor specialized care, clinics like Valencia Medex provide comprehensive English consultations and accept many international private insurances (including Sanitas, Adeslas, and Cigna)."
      },
      { 
        id: 'hl-3', 
        title: 'Pharmacies in Valencia: What to Know', 
        excerpt: 'Opening hours, prescriptions, and over-the-counter meds.', 
        tag: 'Essentials',
        imageUrl: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1200&q=80',
        content: "In Spain, pharmacies are marked by bright green flashing neon crosses. They are highly professional hubs where you can get immediate advice on minor health problems.\n\nFor late-night needs, there is always at least one duty pharmacy ('Farmacia de Guardia') open 24/7 in every neighborhood. When receiving prescriptions from your doctor, bring your SIP card to the chemist so the discounted state price is automatically calculated and applied."
      }
    ]
  },
  { 
    id: 'work', 
    title: 'Work Stuff', 
    description: 'Job search, co-working, and business.', 
    icon_name: 'WorkIcon',
    color: 'bg-indigo-500',
    articles: [
      { 
        id: 'wk-1', 
        title: 'Becoming Autonomo in Spain', 
        excerpt: 'A step-by-step guide for freelancers.', 
        tag: 'Business',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        content: "If you want to freelance or run an online business as an expat in Spain, you need to register as 'autónomo'.\n\nThe process has two core phases: registering for tax with the Agencia Tributaria (Hacienda) and enrolling in the social security scheme (RETA). Freelancers pay a flat-rate social security contribution which starts discounted around €80/month in your first year. We highly recommend hiring a 'gestor' (specialist accountant) to handle your quarterly VAT filings and ensure full compliance.",
        author: { 
          name: "Carlos Mendoza", 
          role: "Tax Advisor & Expat Gestor", 
          businessName: "Gestoría Mendoza",
          website: "https://www.gestoriamendoza.es", 
          email: "carlos@gestoriamendoza.es", 
          phone: "+34 962 334 455" 
        }
      },
      { 
        id: 'wk-2', 
        title: 'Top Co-working Spaces in Valencia', 
        excerpt: 'Where to find the best community and coffee.', 
        tag: 'Remote Work',
        imageUrl: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80',
        content: "Valencia is ranked as a premier digital nomad hub for good reason! Coworking spaces like Vortex Coworking (located near both El Carmen and the Beach area) offer modern facilities, speedy fiber internet, and awesome weekly networking meetups.\n\nOther outstanding hubs like Wayco offer beautiful spaces set inside historic buildings with high ceilings, private Skype booths, and nice cafes on the terrace to share ideas with fellow nomads."
      },
      { 
        id: 'wk-3', 
        title: 'The Digital Nomad Visa Guide', 
        excerpt: 'Requirements and application process.', 
        tag: 'Legal',
        imageUrl: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1200&q=80',
        content: "Spain’s Digital Nomad Visa allows non-EU citizens to live in the sunny Mediterranean while working remotely for companies based outside of Spain.\n\nRequirements include proving continuous employment with a foreign client for over 3 months, earning a minimum income equivalent to 200% of the Spanish minimum wage (around €2,400/month), and securing local private health insurance. The application can be submitted directly inside Spain on a tourist visa for a swift 3-year residency permit."
      }
    ]
  },
  { 
    id: 'daily-tips', 
    title: 'Daily Life Tips', 
    description: 'Transport, shopping, and local habits.', 
    icon_name: 'TipsIcon',
    color: 'bg-amber-500',
    articles: [
      { 
        id: 'dt-1', 
        title: 'Supermarket Comparison', 
        excerpt: 'Mercadona vs. Consum vs. Lidl: Where to shop.', 
        tag: 'Shopping',
        imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80',
        content: "Grocery shopping is highly local in Valencia. Mercadona (a Valencian brand) is famous for its private label Hacendado and super fresh local fish counters.\n\nConsum (another cooperative) is awesome for meat slicing deli-counters and customized coupon discounts. If you love organic supplies at cheap prices, Lidl and Carrefour satisfy every expat need. Don't forget to visit your local neighborhood green-market ('Mercado Municipal') for incredibly cheap and fresh fruits and veggies."
      },
      { 
        id: 'dt-2', 
        title: 'Understanding the Siesta Culture', 
        excerpt: 'When things open, close, and when to eat.', 
        tag: 'Habits',
        imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80',
        content: "The Spanish timetable is unique and takes a little adjustment. Lunch is the main meal of the day, enjoyed between 2:00 PM and 4:00 PM, while dinner rarely starts before 9:00 PM or 10:00 PM.\n\nMany smaller local shops close for the 'siesta' block from 2:00 PM to 5:00 PM before opening again until 8:30 PM. Larger supermarkets and retail franchises stay open continuously all day. Relax, slow down, and adjust your internal rhythm to the local sunshine."
      },
      { 
        id: 'dt-3', 
        title: 'Learning Spanish in Valencia', 
        excerpt: 'Best schools and language exchange meetups.', 
        tag: 'Language',
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
        content: "Speaking the local language opens incredible doors. Valencia has fantastic language schools like Hispania, Escuela de Español, and El Rincón del Tándem, which offer certified group classes for all levels.\n\nFor informal practice, language exchanges ('Intercambios') meet almost every evening in cafes in Ruzafa and El Carmen. It's a fun, welcoming way to practice Spanish while helping locals improve their English over a cool Spanish beer."
      }
    ]
  },
  { 
    id: 'city-fun', 
    title: 'City Fun', 
    description: 'Best spots, events, and leisure.', 
    icon_name: 'CityFunIcon',
    color: 'bg-cyan-500',
    articles: [
      { 
        id: 'cf-1', 
        title: 'The Ultimate Fallas Guide', 
        excerpt: 'How to survive and enjoy the biggest festival.', 
        tag: 'Events',
        imageUrl: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&q=80',
        content: "Las Fallas is Valencia's signature world-famous spring festival. Taking place in mid-March, it transforms the entire city with gigantic, highly detailed wooden monuments, crazy firework events (especially the loud daily 'Mascletà' at 2:00 PM inside Plaza del Ayuntamiento), and colorful traditional costumes.\n\nTo enjoy it fully: buy comfortable walking shoes, prepare for persistent firecracker noise, and indulge in street-side pumpkin buñuelos dipped in hot chocolate!",
        author: { 
          name: "Laia Moreno", 
          role: "Local Culture and Festivals Guide", 
          businessName: "Valencia Culture Tours",
          website: "https://www.valenciafallas.es/en", 
          email: "laia@valenciafallas.es", 
          phone: "+34 654 321 098" 
        }
      },
      { 
        id: 'cf-2', 
        title: 'Hidden Gems: Secret Spots in the Turia', 
        excerpt: 'Escape the crowds in the city\'s green lung.', 
        tag: 'Nature',
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
        content: "While everyone knows the major segments of the Turia, there are secret patches that feel like quiet forest escapes. The area near the Palau de la Música contains gorgeous rose gardens ('La Rosaleda'), which bloom beautifully in spring.\n\nOn the far west, bordering Mislata, you will discover peaceful ponds filled with turtles and ducks. Rent a bicycle early in the morning to explore these isolated green corners in peace and quiet."
      },
      { 
        id: 'cf-3', 
        title: 'Best Tapas Bars in the Old Town', 
        excerpt: 'Authentic flavors away from the tourist traps.', 
        tag: 'Food',
        imageUrl: 'https://images.unsplash.com/photo-1515467876026-78f87a2408c5?auto=format&fit=crop&w=1200&q=80',
        content: "Avoid standard tourist traps on major avenues! Instead, wander deep into the narrow cobblestone streets of El Carmen.\n\nHead to local institutions like Bar Pilar for their legendary steamed 'clochinas' (local Mediterranean mussels) or Tasca Ángel for incredible grilled sardines right off the griddle. Wash it all down with a cold glass of 'Agua de Valencia', our delicious local cocktail crafted with fresh orange juice, cava, gin, and vodka."
      }
    ]
  }
];

export const guideService = {
  getLocalGuides(): GuideCategory[] {
    const cached = localStorage.getItem('local_guide_categories');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached guides", e);
      }
    }
    localStorage.setItem('local_guide_categories', JSON.stringify(MOCK_GUIDE_CATEGORIES_DATA));
    return MOCK_GUIDE_CATEGORIES_DATA;
  },

  saveLocalGuides(guides: GuideCategory[]) {
    localStorage.setItem('local_guide_categories', JSON.stringify(guides));
  },

  async getGuideCategories(): Promise<GuideCategory[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning local cached/mock guide categories');
      return this.getLocalGuides();
    }

    try {
      const { data: dbCategories, error: catError } = await supabase
        .from('guide_categories')
        .select('id, title, description, icon_name, color');

      if (catError) {
        console.warn('Error fetching guide_categories from Supabase, table might not be created yet. Falling back to local guides.', catError);
        return this.getLocalGuides();
      }

      // If the guide_categories table exists but is empty, let's proactively auto-seed it and articles!
      if (!dbCategories || dbCategories.length === 0) {
        console.info('guide_categories table is empty. Proactively performing auto-seeding...');
        await this.seedGuideCategories();
        return this.getLocalGuides();
      }

      // Now fetch guide_articles
      const { data: dbArticles, error: artError } = await supabase
        .from('guide_articles')
        .select('id, category_id, title, excerpt, tag, content, image_url, business_name, author');

      if (artError) {
        console.warn('Error fetching guide_articles from Supabase, table might not be created yet. Returning categories with empty articles list.', artError);
        const enrichedCategories: GuideCategory[] = dbCategories.map((dbCat: any) => {
          const localMatch = this.getLocalGuides().find(mock => mock.id === dbCat.id);
          return {
            id: dbCat.id,
            title: dbCat.title,
            description: dbCat.description,
            icon_name: dbCat.icon_name,
            color: dbCat.color,
            articles: localMatch ? localMatch.articles : []
          };
        });
        return enrichedCategories;
      }

      // If articles table exists but is empty, seed articles and return mock data for safety
      if (!dbArticles || dbArticles.length === 0) {
        console.info('guide_articles table is empty. Proactively performing auto-seeding for articles...');
        await this.seedGuideArticles();
        return this.getLocalGuides();
      }

      // Map snake_case columns back to the client-side camelCase format
      const mappedArticles = dbArticles.map((art: any) => ({
        id: art.id,
        category_id: art.category_id,
        title: art.title,
        excerpt: art.excerpt,
        tag: art.tag,
        content: art.content,
        imageUrl: art.image_url,
        businessName: art.business_name,
        author: art.author // stored as jsonb
      }));

      // Combine database categories with matching database articles
      const enrichedCategories: GuideCategory[] = dbCategories.map((dbCat: any) => {
        const catArticles = mappedArticles.filter((art: any) => art.category_id === dbCat.id);
        return {
          id: dbCat.id,
          title: dbCat.title,
          description: dbCat.description,
          icon_name: dbCat.icon_name,
          color: dbCat.color,
          articles: catArticles
        };
      });

      return enrichedCategories;
    } catch (err) {
      console.error('Failed to get guides and categories from Supabase:', err);
      return this.getLocalGuides();
    }
  },

  async createArticle(art: GuideArticle, categoryId: string): Promise<void> {
    // 1. Update in local storage
    const guides = this.getLocalGuides();
    const targetCat = guides.find(c => c.id === categoryId);
    if (targetCat) {
      if (!targetCat.articles) targetCat.articles = [];
      targetCat.articles.push(art);
      this.saveLocalGuides(guides);
    }

    // 2. Insert into Supabase if configured
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('guide_articles')
        .insert({
          id: art.id,
          category_id: categoryId,
          title: art.title,
          excerpt: art.excerpt,
          tag: art.tag || null,
          content: art.content || null,
          image_url: art.imageUrl || null,
          business_name: art.businessName || null,
          author: art.author || null
        });
      if (error) {
        console.error('Failed to create article in Supabase:', error);
        throw error;
      }
    }
  },

  async updateArticle(art: GuideArticle, categoryId: string): Promise<void> {
    // 1. Update in local storage
    const guides = this.getLocalGuides();
    
    // Remove if exists anywhere
    for (const cat of guides) {
      const idx = cat.articles.findIndex(a => a.id === art.id);
      if (idx !== -1) {
        cat.articles.splice(idx, 1);
        break;
      }
    }

    // Insert into specified category
    const targetCat = guides.find(c => c.id === categoryId);
    if (targetCat) {
      targetCat.articles.push(art);
    } else {
      guides[0].articles.push(art);
    }
    this.saveLocalGuides(guides);

    // 2. Update in Supabase if configured
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('guide_articles')
        .update({
          category_id: categoryId,
          title: art.title,
          excerpt: art.excerpt,
          tag: art.tag || null,
          content: art.content || null,
          image_url: art.imageUrl || null,
          business_name: art.businessName || null,
          author: art.author || null
        })
        .eq('id', art.id);
      if (error) {
        console.error('Failed to update article in Supabase:', error);
        throw error;
      }
    }
  },

  async deleteArticle(artId: string): Promise<void> {
    // 1. Delete from local storage
    const guides = this.getLocalGuides();
    for (const cat of guides) {
      const idx = cat.articles.findIndex(a => a.id === artId);
      if (idx !== -1) {
        cat.articles.splice(idx, 1);
        break;
      }
    }
    this.saveLocalGuides(guides);

    // 2. Delete from Supabase if configured
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('guide_articles')
        .delete()
        .eq('id', artId);
      if (error) {
        console.error('Failed to delete article in Supabase:', error);
        throw error;
      }
    }
  },

  async seedGuideCategories(): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const pureCategories = MOCK_GUIDE_CATEGORIES_DATA.map(({ id, title, description, icon_name, color }) => ({
        id,
        title,
        description,
        icon_name,
        color
      }));

      const { error } = await supabase
        .from('guide_categories')
        .upsert(pureCategories);

      if (error) {
        console.warn('Could not auto-seed guide categories (table may need creation or correct RLS policy):', error);
      } else {
        console.info('Successfully auto-seeded guide categories into Supabase!');
        await this.seedGuideArticles();
      }
    } catch (err) {
      console.error('Error seeding guide categories:', err);
    }
  },

  async seedGuideArticles(): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const articlesToInsert: any[] = [];
      MOCK_GUIDE_CATEGORIES_DATA.forEach(cat => {
        cat.articles.forEach((art: any) => {
          articlesToInsert.push({
            id: art.id,
            category_id: cat.id,
            title: art.title,
            excerpt: art.excerpt,
            tag: art.tag || null,
            content: art.content || null,
            image_url: art.imageUrl || null,
            business_name: art.businessName || null,
            author: art.author || null
          });
        });
      });

      const { error } = await supabase
        .from('guide_articles')
        .upsert(articlesToInsert);

      if (error) {
        console.warn('Could not auto-seed guide articles (table may need creation or correct RLS policy):', error);
      } else {
        console.info('Successfully auto-seeded guide articles into Supabase!');
      }
    } catch (err) {
      console.error('Error seeding guide articles:', err);
    }
  }
};
