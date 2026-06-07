import { ChevronDown } from "lucide-react";
import Image from "next/image";

interface UserProps {
  user: { name: string; email: string; role: string } | null;
}

export default function User({ user }: UserProps) {
  return (
    <div className="flex h-16 items-center border-b border-border px-2">
      <div className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-800">
        <div className="flex items-center">
          <Image
            src="/avatar.png"
            alt="User"
            className="mr-2 rounded-full"
            width={36}
            height={36}
          />
          <div className="flex flex-col">
            {user ? (
              <>
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs capitalize text-muted-foreground">{user.role}</span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium">Guest</span>
                <span className="text-xs text-muted-foreground">Not logged in</span>
              </>
            )}
          </div>
        </div>
        {user && <ChevronDown size={16} />}
      </div>
    </div>
  );
}