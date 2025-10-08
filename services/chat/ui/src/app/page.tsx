"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Prefill từ localStorage nếu đã từng nhập
  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = localStorage.getItem("x-user-id") || "";
    const o = localStorage.getItem("x-org-id") || "";
    setUserId(u);
    setOrgId(o);
  }, []);

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const uid = userId.trim();
    const oid = orgId.trim();

    if (!uid || !oid) {
      setError("Vui lòng nhập đầy đủ x-user-id và x-org-id.");
      return;
    }

    // Lưu để /chat đọc lại (client)
    localStorage.setItem("x-user-id", uid);
    localStorage.setItem("x-org-id", oid);

    // Điều hướng sang trang chat
    router.push("/chat");
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto size-10 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600" />
          <h1 className="mt-3 text-xl font-semibold">Welcome</h1>
          <p className="text-sm text-zinc-500">Nhập thông tin để tiếp tục vào Chat</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="x-user-id">
              x-user-id
            </label>
            <input
              id="x-user-id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="vd: 9b7c1b0e-..."
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="x-org-id">
              x-org-id
            </label>
            <input
              id="x-org-id"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="vd: 2f1a0c3d-..."
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-500"
          >
            Go to Chat
          </button>

          <p className="text-[11px] text-zinc-500 text-center">
            Thông tin sẽ được lưu tạm thời trong trình duyệt (localStorage).
          </p>
        </form>
      </div>
    </div>
  );
}
