"use client";

import { Home, Book, BarChart2, User, LogOut, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type NavItem = "learn" | "courses" | "stats" | "account" | "practice";

interface AppSidebarProps {
  activeItem?: NavItem;
}

const navLinks: { id: NavItem; label: string; icon: React.ElementType; href: string }[] = [
  { id: "learn", label: "Learn", icon: Home, href: "/home?section=learn" },
  { id: "courses", label: "Courses", icon: Book, href: "/home?section=courses" },
  { id: "practice", label: "Practice", icon: Mic, href: "/practices" },
  { id: "stats", label: "Stats", icon: BarChart2, href: "/home?section=stats" },
  { id: "account", label: "Account", icon: User, href: "/home?section=account" },
];

export default function AppSidebar({ activeItem }: AppSidebarProps) {
  const router = useRouter();
  const { logoutMutation } = useAuth();

  const handleSignOut = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => router.push("/"),
    });
  };

  return (
    <div className="w-64 bg-white text-[#4e342e] flex flex-col h-screen fixed left-0 border-r border-gray-200 z-10">
      <div className="pt-5 pb-4">
        <h1 className="text-2xl font-bold text-[#4e342e] text-center">Mentarie</h1>
      </div>

      <nav className="flex-1 flex flex-col">
        {navLinks.map(({ id, label, icon: Icon, href }) => (
          <a
            key={id}
            href="#"
            className={`flex items-center px-5 py-4 font-medium gap-2.5 ${
              activeItem === id
                ? "bg-[#4e342e] text-white"
                : "text-[#4e342e] hover:bg-gray-100"
            }`}
            onClick={(e) => {
              e.preventDefault();
              router.push(href);
            }}
          >
            <Icon className="h-5 w-5" />
            {label}
          </a>
        ))}

        <div className="mt-auto">
          <a
            href="#"
            className="flex items-center px-5 py-4 text-[#4e342e] hover:bg-gray-100 gap-2.5 border-t border-gray-200"
            onClick={(e) => {
              e.preventDefault();
              handleSignOut();
            }}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </a>
        </div>
      </nav>
    </div>
  );
}
