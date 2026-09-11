"use client";

import { ProfileView } from "../../views/profile/ProfileView";

export default function ProfilePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F3F4F8] dark:bg-gray-950 p-6 md:p-10">
      <ProfileView />
    </div>
  );
}
