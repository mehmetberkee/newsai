"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState(session?.user?.name || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [session, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Şifre değişikliği kontrolü
      if (newPassword || confirmPassword || currentPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("New passwords don't match");
        }
        if (newPassword.length < 6) {
          throw new Error("New password must be at least 6 characters");
        }
      }

      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setSuccess("Profile updated successfully!");

      // Session'ı güncelle
      if (name !== session?.user?.name) {
        await update({ name });
      }

      // Form alanlarını temizle
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-2xl p-8">
          <div className="max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Profile Settings
            </h1>

            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Account Information
                </h2>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={session.user?.email || ""}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Your email cannot be changed
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Change Password
                </h2>

                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
