import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xmkefhhhsslwceuvjiwb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhta2VmaGhoc3Nsd2NldXZqaXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODI0NTEsImV4cCI6MjA1ODQ1ODQ1MX0.BTCUVzUKyIqGrWcEG1CRcNU_wm8N1ba3_szPktTpyh8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);