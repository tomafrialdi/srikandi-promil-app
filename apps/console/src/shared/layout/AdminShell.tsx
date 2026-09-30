import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** Sidebar + topbar frame around every console page. */
export function AdminShell() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex flex-col gap-6 px-4 py-5 min-[701px]:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
