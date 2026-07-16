import { createBrowserClient } from "@supabase/auth-helpers-nextjs"

let _supabaseClient: ReturnType<typeof createBrowserClient> | null = null

function getSupabaseClient() {
  if (!_supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Your project's URL and API key are required to create a Supabase client!\n\n" +
        "Check your Supabase project's API settings to find these values\n" +
        "https://supabase.com/dashboard/project/_/settings/api"
      )
    }
    _supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabaseClient
}

/** Lazy Supabase client for client components. Use this in "use client" components. */
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof typeof client]
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
})

// Auth helpers
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })
  if (error) throw error

  // Create user record in public.users
  if (data.user) {
    const { error: dbError } = await supabase.from("users").insert({
      id: data.user.id,
      email: data.user.email,
      full_name: fullName || null,
    })
    if (dbError && dbError.code !== "23505") throw dbError
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// User helpers
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()
  if (error) throw error
  return data
}

export async function updateSubscriptionTier(userId: string, tier: "free" | "pro" | "premium") {
  const { error } = await supabase
    .from("users")
    .update({ subscription_tier: tier })
    .eq("id", userId)
  if (error) throw error
}
