//lelou-solidarity-frontend/app/admin/(auth)/layout.tsx
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ocean-700 via-ocean-600 to-ocean-500 px-6">
      {children}
    </main>
  );
}
