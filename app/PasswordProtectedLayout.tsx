"use client";
import Navbar from "@/components/ui/Navbar";
import PasswordGate from "@/components/ui/PasswordGate";

export default function PasswordProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PasswordGate>
      <Navbar />
      {children}
    </PasswordGate>
  );
}
