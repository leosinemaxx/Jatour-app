// app/dashboard/components/SettingsSection.tsx
"use client";

export default function SettingsSection() {
  const accountOptions = [
    "Edit Profile",
    "Notification Settings",
    "Calendar",
    "My Transaction",
  ];
  const generalOptions = [
    "App Settings",
    "Privacy Policy",
    "Terms & Conditions",
    "Theme Settings",
  ];

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <img
          src="https://source.unsplash.com/80x80/?person"
          className="rounded-full w-16 h-16"
          alt="user"
        />
        <div>
          <h2 className="font-semibold text-lg">Lanang Tegar Augurio</h2>
          <p className="text-slate-600 text-sm">@begojoro • Jawa Timur</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Account</h3>
      <div className="flex flex-col gap-2 mb-5">
        {accountOptions.map((opt) => (
          <button key={opt} className="text-left p-3 rounded-lg bg-white/40">
            {opt}
          </button>
        ))}
      </div>

      <h3 className="font-semibold mb-2">General</h3>
      <div className="flex flex-col gap-2 mb-5">
        {generalOptions.map((opt) => (
          <button key={opt} className="text-left p-3 rounded-lg bg-white/40">
            {opt}
          </button>
        ))}
      </div>

      <button className="w-full py-3 rounded-lg bg-red-500 text-white font-semibold mt-3">
        Log Out
      </button>
    </section>
  );
}
