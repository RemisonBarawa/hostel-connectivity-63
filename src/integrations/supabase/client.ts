// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://uggexmdcyoiohiczogrp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZ2V4bWRjeW9pb2hpY3pvZ3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NTQ1NDQsImV4cCI6MjA1ODQzMDU0NH0.uVN_60LKuXp1b4g8obb4hogMRhX_Z9ShbEgNfTLpz2I";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);