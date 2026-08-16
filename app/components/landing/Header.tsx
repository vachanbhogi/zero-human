import { AppNavbar } from "@/components/navigation/AppNavbar";

export interface HeaderProps {
  userEmail?: string | null;
  isPaid?: boolean;
  activeBusinessName?: string | null;
}

export function Header({ userEmail = null, isPaid = false, activeBusinessName = null }: HeaderProps) {
  return (
    <AppNavbar
      userEmail={userEmail}
      isPaid={isPaid}
      activeBusinessName={activeBusinessName}
    />
  );
}
