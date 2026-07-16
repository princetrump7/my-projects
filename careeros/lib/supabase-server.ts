import { createServerClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"


export function createServerSupabase() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // In middleware or edge runtime, setAll may not be available
          }
        },
      },
    }
  )
}

// For middleware (different cookie handling)
export function createMiddlewareSupabase(req: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookie = req.headers.get("cookie") || ""
          return cookie.split("; ").filter(Boolean).map((c) => {
            const [name, ...rest] = c.split("=")
            return { name, value: rest.join("=") }
          })
        },
        setAll(cookiesToSet) {
          // Handled by middleware via response headers
        },
      },
    }
  )

  return supabase
}

export async function getSupabaseUser() {
  const client = createServerSupabase()
  let user = null

  try {
    const authHeader = headers().get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      const { error } = await client.auth.setSession({
        access_token: token,
        refresh_token: "",
      })
      if (!error) {
        const { data: { user: authUser } } = await client.auth.getUser()
        user = authUser
      }
    } else {
      const { data: { user: authUser } } = await client.auth.getUser()
      user = authUser
    }
  } catch (err) {
    console.error("getSupabaseUser error:", err)
  }

  return { user, supabase: client }
}

