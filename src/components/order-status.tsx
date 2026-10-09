"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/server/order-actions";

const STATUSES = ["placed", "packed", "shipped", "delivered", "cancelled"];

export function OrderStatusForm({ storeId, orderId, status }: { storeId: string; orderId: string; status: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  return (
    <form onSubmit={async (event) => {
      event.preventDefault();
      const next = String(new FormData(event.currentTarget).get("status"));
      const result = await updateOrderStatus(storeId, orderId, next);
      setMessage(result.error ?? "Status saved. The customer email copy is on this order.");
      router.refresh();
    }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <select className="input" name="status" defaultValue={status} style={{ maxWidth: 220 }}>
        {STATUSES.map((item) => <option key={item}>{item}</option>)}
      </select>
      <button className="btn" type="submit">Update and notify</button>
      {message && <span>{message}</span>}
    </form>
  );
}
