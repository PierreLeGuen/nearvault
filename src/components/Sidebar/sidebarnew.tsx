import { ShoppingCartIcon } from "@heroicons/react/20/solid";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Treasury
          </h2>
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start">
              <ShoppingCartIcon className="mr-2 h-4 w-4" />
              Listen Now
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Payments
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingCartIcon className="mr-2 h-4 w-4" />
              Playlists
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Approvals
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingCartIcon className="mr-2 h-4 w-4" />
              Playlists
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Accounting
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingCartIcon className="mr-2 h-4 w-4" />
              Playlists
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
