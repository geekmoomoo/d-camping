import React, { useEffect, useState } from "react";
import {
  adminFetchBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
} from "../services/bannerAdminService";

function BannerAdminPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    content: "",
    order: 1,
    active: true,
    imageUrl: "",
  });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    subtitle: "",
    content: "",
    order: 1,
    active: true,
    imageUrl: "",
  });

  const reload = async () => {
    const data = await adminFetchBanners();
    setItems(data || []);
  };

  useEffect(() => {
    reload();
  }, []);

  const create = async () => {
    if (!form.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    await adminCreateBanner(form);
    setForm({
      title: "",
      subtitle: "",
      content: "",
      order: 1,
      active: true,
      imageUrl: "",
    });
    reload();
  };

  const update = async (id, patch) => {
    await adminUpdateBanner(id, patch);
    reload();
  };

  const remove = async (id) => {
    if (!window.confirm("정말 삭제할까요?")) return;
    await adminDeleteBanner(id);
    reload();
  };

  const startEdit = (banner) => {
    setEditing(banner);
    setEditForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      content: banner.content || "",
      order: banner.order ?? 1,
      active: banner.active ?? true,
      imageUrl: banner.imageUrl || "",
    });
  };

  const moveBanner = async (bannerId, direction) => {
    const index = items.findIndex((b) => b.id === bannerId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const current = items[index];
    const target = items[targetIndex];
    const currentOrder = current.order ?? 1;
    const targetOrder = target.order ?? 1;

    try {
      await Promise.all([
        adminUpdateBanner(current.id, { order: targetOrder }),
        adminUpdateBanner(target.id, { order: currentOrder }),
      ]);
      await reload();
    } catch (err) {
      console.error("[admin/banners] move error", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>배너 관리</h2>

      <div style={{ marginBottom: 40 }}>
        <h3>새 배너 생성</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="부제목"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          />
          <textarea
            placeholder="내용"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
          />
          <input
            type="number"
            placeholder="order"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            노출 상태 (active)
          </label>
          <input
            placeholder="이미지 URL (선택)"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          <button onClick={create}>추가</button>
        </div>
      </div>

      <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 6px" }}>order</th>
            <th style={{ textAlign: "left", padding: "8px 6px" }}>title</th>
            <th style={{ padding: "8px 6px" }}>active</th>
            <th style={{ padding: "8px 6px" }}>관리</th>
            <th style={{ padding: "8px 6px" }}>순서 조정</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b, index) => (
            <tr key={b.id}>
              <td style={{ padding: "6px" }}>
                <input
                  type="number"
                  value={b.order ?? 0}
                  onChange={(e) => update(b.id, { order: Number(e.target.value) || 0 })}
                />
              </td>
              <td style={{ padding: "6px" }}>
                <div>{b.title}</div>
              </td>
              <td style={{ padding: "6px", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={!!b.active}
                  onChange={(e) => update(b.id, { active: e.target.checked })}
                />
              </td>
              <td style={{ padding: "6px" }}>
                <button type="button" onClick={() => startEdit(b)}>
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => remove(b.id)}
                  style={{ marginLeft: 6 }}
                >
                  삭제
                </button>
              </td>
              <td style={{ padding: "6px" }}>
                <button
                  type="button"
                  onClick={() => moveBanner(b.id, "up")}
                  disabled={index === 0}
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveBanner(b.id, "down")}
                  disabled={index === items.length - 1}
                  style={{ marginLeft: 6 }}
                >
                  ▼
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div style={{ marginTop: 40 }}>
          <h3>선택된 배너 수정</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label>제목</label>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <label>부제목</label>
              <input
                value={editForm.subtitle}
                onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
              />
            </div>
            <div>
              <label>내용</label>
              <textarea
                rows={6}
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              />
            </div>
            <div>
              <label>이미지 URL</label>
              <input
                value={editForm.imageUrl}
                onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
              />
            </div>
            <div>
              <label>노출 순서(order)</label>
              <input
                type="number"
                value={editForm.order}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    order: Number(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <label>노출 여부(active)</label>
              <input
                type="checkbox"
                checked={!!editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={async () => {
                  await adminUpdateBanner(editing.id, editForm);
                  setEditing(null);
                  await reload();
                }}
              >
                수정 내용 저장
              </button>
              <button type="button" onClick={() => setEditing(null)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BannerAdminPage;
