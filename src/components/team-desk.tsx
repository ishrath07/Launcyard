"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addStaff, removeStaff } from "@/server/catalog-actions";

export function TeamDesk({
  storeId,
  members,
}: {
  storeId: string;
  members: { userId: string; email: string; name: string; role: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  return (
    <div>
      {message && <p>{message}</p>}
      <table>
        <tbody>
          {members.map((member) => (
            <tr key={member.userId}>
              <td>{member.name}<div className="muted">{member.email}</div></td>
              <td>{member.role}</td>
              <td>
                {member.role === "STAFF" && (
                  <button className="btn-ghost" type="button" onClick={async () => {
                    const result = await removeStaff(storeId, member.userId);
                    setMessage(result.error ?? "Removed.");
                    router.refresh();
                  }}>Remove</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="panel" style={{ marginTop: 12 }} onSubmit={async (event) => {
        event.preventDefault();
        const email = String(new FormData(event.currentTarget).get("email") ?? "");
        const result = await addStaff(storeId, email);
        setMessage(result.error ?? "Staff member added. They only see this store.");
        router.refresh();
      }}>
        <label className="field"><span>Staff email (they need an account first)</span><input name="email" type="email" required /></label>
        <button className="btn" type="submit">Add staff</button>
      </form>
    </div>
  );
}
