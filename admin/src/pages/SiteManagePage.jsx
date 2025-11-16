import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminSites, updateAdminSite } from "../services/siteAdminService.js";
import WysiwygEditor from "../components/WysiwygEditor.jsx";

const booleanLabel = (value) => (value ? "사용중" : "숨김");

const blankForm = {
  name: "",
  zone: "",
  type: "",
  baseAmount: "",
  defaultPeople: "",
  maxPeople: "",
  extraPersonAmount: "",
  offWeekdayAmount: "",
  offWeekendAmount: "",
  peakWeekdayAmount: "",
  peakWeekendAmount: "",
  carOption: "",
  productDescription: "",
  isActive: true,
  descriptionShort: "",
  descriptionLong: "",
  mainImageUrl: "",
  galleryImageUrlsText: "",
  noticeHighlight: "",
  noticeHtml: "",
};

export default function SiteManagePage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSite, setSelectedSite] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const getSiteIdParts = (site) => {
    const rawId = (site?.siteId || site?.id || "").toUpperCase();
    const match = rawId.match(/^([^\d]*)(\d+)$/);
    return {
      prefix: match ? match[1] : rawId,
      number: match ? Number(match[2]) : null,
      raw: rawId,
    };
  };

  const compareSiteIds = (a, b) => {
    const aParts = getSiteIdParts(a);
    const bParts = getSiteIdParts(b);
    const prefixDiff = aParts.prefix.localeCompare(bParts.prefix);
    if (prefixDiff !== 0) {
      return prefixDiff;
    }
    if (aParts.number !== null && bParts.number !== null) {
      return aParts.number - bParts.number;
    }
    return aParts.raw.localeCompare(bParts.raw);
  };

  const loadSites = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminSites();
      const sorted = [...data].sort(compareSiteIds);
      setSites(sorted);
      if (!selectedSite && sorted.length > 0) {
        handleSelect(sorted[0]);
      }
    } catch (err) {
      console.error("[SiteManagePage] failed to fetch sites", err);
      setError("사이트 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typeOptions = useMemo(() => {
    const uniq = new Set();
    sites.forEach((site) => {
      if (site?.type) {
        uniq.add(site.type);
      }
    });
    return Array.from(uniq).sort();
  }, [sites]);

  const populateForm = (site) => {
    setForm({
      name: site.name || "",
      zone: site.zone || "",
      type: site.type || "",
      baseAmount: site.baseAmount ?? "",
      defaultPeople: site.defaultPeople ?? "",
      maxPeople: site.maxPeople ?? "",
      extraPersonAmount: site.extraPersonAmount ?? "",
      offWeekdayAmount: site.offWeekdayAmount ?? "",
      offWeekendAmount: site.offWeekendAmount ?? "",
      peakWeekdayAmount: site.peakWeekdayAmount ?? "",
      peakWeekendAmount: site.peakWeekendAmount ?? "",
      carOption: site.carOption || "",
      productDescription: site.productDescription || "",
      isActive: site.isActive ?? true,
      descriptionShort: site.descriptionShort || "",
      descriptionLong: site.descriptionLong || "",
      mainImageUrl: site.mainImageUrl || "",
      galleryImageUrlsText: (site.galleryImageUrls || []).join("\n"),
      noticeHighlight: site.noticeHighlight || "",
      noticeHtml:
        site.noticeHtml ||
        (Array.isArray(site.noticeLines)
          ? site.noticeLines.map((line) => `<p>${line}</p>`).join("")
          : ""),
    });
  };

  const htmlToTextLines = (html = "") => {
    if (!html) return [];
    const parser = typeof DOMParser !== "undefined" ? new DOMParser() : null;
    if (!parser) {
      return html
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
    const doc = parser.parseFromString(html, "text/html");
    const text = doc.body.textContent || "";
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const handleSelect = (site) => {
    setSelectedSite(site);
    populateForm(site);
    setMessage("");
  };

  const handleSave = async () => {
    if (!selectedSite) return;
    setSaving(true);
    setMessage("");
    try {
      const gallery = form.galleryImageUrlsText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);
      const noticeLines = htmlToTextLines(form.noticeHtml);
      const payload = {
        id: selectedSite.id,
        name: form.name,
        zone: form.zone,
        type: form.type,
        baseAmount: form.baseAmount ? Number(form.baseAmount) : null,
        defaultPeople: form.defaultPeople ? Number(form.defaultPeople) : null,
        maxPeople: form.maxPeople ? Number(form.maxPeople) : null,
        extraPersonAmount: form.extraPersonAmount
          ? Number(form.extraPersonAmount)
          : null,
        offWeekdayAmount: form.offWeekdayAmount
          ? Number(form.offWeekdayAmount)
          : null,
        offWeekendAmount: form.offWeekendAmount
          ? Number(form.offWeekendAmount)
          : null,
        peakWeekdayAmount: form.peakWeekdayAmount
          ? Number(form.peakWeekdayAmount)
          : null,
        peakWeekendAmount: form.peakWeekendAmount
          ? Number(form.peakWeekendAmount)
          : null,
        carOption: form.carOption,
        productDescription: form.productDescription,
        noticeHighlight: form.noticeHighlight,
        noticeHtml: form.noticeHtml,
        noticeLines,
        isActive: form.isActive,
        descriptionShort: form.descriptionShort,
        descriptionLong: form.descriptionLong,
        mainImageUrl: form.mainImageUrl,
        galleryImageUrls: gallery,
      };
      const updated = await updateAdminSite(payload);
      setMessage("저장되었습니다.");
      setSites((prev) =>
        prev.map((site) => (site.id === updated.id ? updated : site))
      );
      setSelectedSite(updated);
      populateForm(updated);
    } catch (err) {
      console.error("[SiteManagePage] update failed", err);
      setMessage("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="dc-card">
        <div className="dc-card-title">
          <span>사이트 관리</span>
          <button type="button" className="dc-btn dc-btn-outline" onClick={loadSites}>
            새로고침
          </button>
        </div>
        {error && (
          <p className="dc-status-text" style={{ color: "#c0392b" }}>
            {error}
          </p>
        )}
        {loading && <p className="dc-status-text">로딩 중...</p>}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 380px", minWidth: 320 }}>
            <div className="dc-card">
              <div className="dc-card-title">사이트 목록</div>
              {!loading && !error && (
                <div className="dc-table-wrap">
                  <table className="dc-table">
                    <thead>
                      <tr>
                        <th>사이트ID</th>
                        <th>이름</th>
                        <th>구역</th>
                        <th>타입</th>
                        <th>기본요금</th>
                        <th>최대인원</th>
                        <th>노출</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((site) => (
                        <tr
                          key={site.id}
                          style={{
                            cursor: "pointer",
                            background:
                              selectedSite?.id === site.id ? "#f1e7d5" : undefined,
                          }}
                          onClick={() => handleSelect(site)}
                        >
                          <td>{site.siteId || site.id}</td>
                          <td>{site.name || "-"}</td>
                          <td>{site.zone || "-"}</td>
                          <td>{site.type || "-"}</td>
                          <td>
                            {site.baseAmount != null
                              ? `${site.baseAmount.toLocaleString()}원`
                              : "-"}
                          </td>
                          <td>{site.maxPeople ?? "-"}</td>
                          <td>{booleanLabel(site.isActive)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div style={{ flex: "1 1 480px", minWidth: 320 }}>
            <div className="dc-card">
              <div className="dc-card-title">선택된 사이트 편집</div>
              {!selectedSite && !loading && <p className="dc-status-text">사이트를 선택해 주세요.</p>}
              {selectedSite && (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <div className="dc-card-subtitle">기본 정보</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div>
                        <label className="dc-field-label">사이트 ID</label>
                        <p>{selectedSite.siteId || selectedSite.id}</p>
                      </div>
                      <div>
                        <label className="dc-field-label">이름</label>
                        <input
                          className="dc-field-input"
                          value={form.name}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="dc-field-label">구역</label>
                        <input
                          className="dc-field-input"
                          value={form.zone}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, zone: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="dc-field-label">타입</label>
                        <select
                          className="dc-field-input"
                          value={form.type}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, type: event.target.value }))
                          }
                        >
                          <option value="">선택</option>
                          {typeOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                          }
                        />
                        <span className="dc-field-label">노출 여부</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div className="dc-card-subtitle">인원/요금 정보</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div>
                        <label className="dc-field-label">기준 인원</label>
                        <input
                          className="dc-field-input"
                          type="number"
                          value={form.defaultPeople}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, defaultPeople: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="dc-field-label">최대 인원</label>
                        <input
                          className="dc-field-input"
                          type="number"
                          value={form.maxPeople}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, maxPeople: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="dc-field-label">기본 요금</label>
                        <input
                          className="dc-field-input"
                          type="number"
                          value={form.baseAmount}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, baseAmount: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="dc-field-label">추가 인원 요금</label>
                        <input
                          className="dc-field-input"
                          type="number"
                          value={form.extraPersonAmount}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              extraPersonAmount: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="dc-field-label">성수기 평일</label>
                        <input
                          className="dc-field-input"
                          type="number"
                          value={form.peakWeekdayAmount}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, peakWeekdayAmount: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="dc-field-label">성수기 주말</label>
                        <input
                          className="dc-field-input"
                          type="number"
                          value={form.peakWeekendAmount}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, peakWeekendAmount: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="dc-field-label">비수기 평일</label>
                        <input
                          className="dc-field-input"
                          type="number"
                          value={form.offWeekdayAmount}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, offWeekdayAmount: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="dc-field-label">비수기 주말</label>
                        <input
                          className="dc-field-input"
                          type="number"
                          value={form.offWeekendAmount}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, offWeekendAmount: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div className="dc-card-subtitle">텍스트 정보</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div>
                        <label className="dc-field-label">상품소개 (간략)</label>
                        <input
                          className="dc-field-input"
                          value={form.descriptionShort}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, descriptionShort: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="dc-field-label">차 옵션</label>
                        <input
                          className="dc-field-input"
                          value={form.carOption}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, carOption: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="dc-field" style={{ marginTop: 12 }}>
                      <label className="dc-field-label">상품 설명 (상세)</label>
                      <WysiwygEditor
                        value={form.productDescription}
                        onChange={(html) =>
                          setForm((prev) => ({ ...prev, productDescription: html }))
                        }
                      />
                    </div>
                    <div className="dc-field" style={{ marginTop: 12 }}>
                      <label className="dc-field-label">상품 설명 (긴)</label>
                      <textarea
                        className="dc-field-input"
                        rows={2}
                        value={form.descriptionLong}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, descriptionLong: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div className="dc-card-subtitle">알립니다</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div>
                        <label className="dc-field-label">강조 문구</label>
                        <input
                          className="dc-field-input"
                          value={form.noticeHighlight}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, noticeHighlight: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="dc-field" style={{ marginTop: 12 }}>
                      <label className="dc-field-label">안내 문구 (에디터)</label>
                      <WysiwygEditor
                        value={form.noticeHtml}
                        onChange={(html) => setForm((prev) => ({ ...prev, noticeHtml: html }))}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div className="dc-card-subtitle">이미지</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div>
                        <label className="dc-field-label">대표 이미지 URL</label>
                        <input
                          className="dc-field-input"
                          value={form.mainImageUrl}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, mainImageUrl: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="dc-field" style={{ marginTop: 12 }}>
                      <label className="dc-field-label">갤러리 이미지 URL (줄바꿈 구분)</label>
                      <textarea
                        className="dc-field-input"
                        rows={3}
                        value={form.galleryImageUrlsText}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, galleryImageUrlsText: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
                    <button
                      type="button"
                      className="dc-btn dc-btn-primary"
                      disabled={saving}
                      onClick={handleSave}
                    >
                      {saving ? "저장 중..." : "저장"}
                    </button>
                    {message && (
                      <span
                        className="dc-status-text"
                        style={{ color: message.includes("오류") ? "#c0392b" : "#1b7c7c" }}
                      >
                        {message}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
