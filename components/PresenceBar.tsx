"use client"

import { CollabUser } from "@/lib/useCollaboration"

export default function PresenceBar({
  users,
  isConnected,
}: {
  users: CollabUser[]
  isConnected: boolean
}) {
  if (users.length === 0 && !isConnected) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {users.length > 0 ? (
          <div className="flex -space-x-1.5">
            {users.slice(0, 5).map((user, i) => (
              <div
                key={`${user.name}-${i}`}
                className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-surface text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 5 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-surface bg-gray-200 dark:bg-gray-700 text-[10px] font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                +{users.length - 5}
              </div>
            )}
          </div>
        ) : null}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {users.length === 0
            ? "No one else here"
            : users.length === 1
            ? "1 editor"
            : `${users.length} editors`}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isConnected
              ? "bg-emerald-500"
              : "bg-yellow-500 animate-pulse"
          }`}
        />
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {isConnected ? "Live" : "Reconnecting..."}
        </span>
      </div>
    </div>
  )
}
