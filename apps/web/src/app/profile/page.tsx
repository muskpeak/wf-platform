"use client";

import { ProfileView } from "../../views/profile/ProfileView";

export default function ProfilePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F3F4F8] dark:bg-[#0E131F] md:py-8 md:px-8">
      <ProfileView />
    </div>
  );
}
