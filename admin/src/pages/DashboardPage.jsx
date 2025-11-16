import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminStatsSummary } from "../services/reservationAdminService.js";

const pad2 = (value) => String(value).padStart(2, "0");
const formatMonthRange = (date = new Date()) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const start = `${year}-${month}-01`;
  const end = `${year}-${month}-${pad2(new Date(year, month, 0).getDate())}`;
  return { start, end };
};

const formatCurrency = (value) => {
  if (value === undefined || value === null) {
    return "-";
  }
  return `${Number(value).toLocaleString()}원`;
};

const truncate = (value, limit = 40) => {
  if (!value) return "-";
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
};

export default function DashboardPage({ onSelectReservation }) {
  const defaultRange = formatMonthRange();
  const [range, setRange] = useState({
    from: defaultRange.start,
    to: defaultRange.end,
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminStatsSummary({
        from: range.from,
        to: range.to,
      });
      setStats(data);
    } catch (err) {
      console.error(err);
      setError("통계 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const handleApply = () => {
    loadStats();
  };

  const today = stats?.today ?? {};
  const month = stats?.month ?? {};

  return (
    <div>
      <div className="dc-card">
        <div className="dc-card-title">대시보드 통계</div>
        <div
          className="dc-field"
          style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
        >
          <div style={{ flex: "1 1 180px" }}>
            <label className="dc-field-label">통계 기간 시작</label>
            <input
              type="date"
              className="dc-field-input"
              value={range.from}
              onChange={(e) =>
                setRange((prev) => ({ ...prev, from: e.target.value }))
              }
            />
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <label className="dc-field-label">통계 기간 종료</label>
            <input
              type="date"
              className="dc-field-input"
              value={range.to}
              onChange={(e) =>
                setRange((prev) => ({ ...prev, to: e.target.value }))
              }
            />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button type="button" className="dc-btn dc-btn-primary" onClick={handleApply}>
              적용
            </button>
          </div>
        </div>
      </div>
      {error && (
        <p className="dc-status-text" style={{ color: "#c0392b" }}>
          {error}
        </p>
      )}
      <div
        className="dc-card"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}
      >
        {[{ title: "오늘 일정 요약", content: [
          `체크인: ${today.checkInCount ?? 0}건`,
          `체크아웃: ${today.checkOutCount ?? 0}건`,
          `현재 투숙: ${today.inHouseCount ?? 0}건`,
        ] }, {
          title: "오늘 매출 (온라인)",
          content: [
            `결제 금액: ${formatCurrency(today.paidAmount ?? 0)}`,
            `환불 금액: ${formatCurrency(today.refundAmount ?? 0)}`,
          ],
        }, {
          title: "이번 달 예약/취소",
          content: [
            `예약: ${month.reservationCount ?? 0}건`,
            `환불/취소: ${month.cancelCount ?? 0}건`,
          ],
        }, {
          title: "이번 달 매출",
          content: [
            `결제 금액: ${formatCurrency(month.paidAmount ?? 0)}`,
            `환불 금액: ${formatCurrency(month.refundAmount ?? 0)}`,
          ],
        }].map((card) => (
          <div key={card.title} className="dc-status-card">
            <div className="dc-card-title" style={{ margin: 0, padding: 0 }}>
              {card.title}
            </div>
            <div style={{ marginTop: 8 }}>
              {card.content.map((line) => (
                <p key={line} style={{ margin: "2px 0" }}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <div className="dc-card">
          <div className="dc-card-title">사이트별 예약 TOP 3</div>
          {stats?.topSites?.length > 0 ? (
            <table className="dc-table">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>사이트</th>
                  <th>예약 건수</th>
                </tr>
              </thead>
              <tbody>
                {stats.topSites.map((site, idx) => (
                  <tr key={site.siteId}>
                    <td>{idx + 1}</td>
                    <td>{site.siteName || site.siteId}</td>
                    <td>{site.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="dc-status-text">데이터 없음</p>
          )}
        </div>
        <div className="dc-card">
          <div className="dc-card-title">최근 환불 요청</div>
          {stats?.recentRefunds?.length > 0 ? (
            <table className="dc-table">
              <thead>
                <tr>
                  <th>접수일시</th>
                  <th>예약번호</th>
                  <th>사이트</th>
                  <th>상태</th>
                  <th>사유</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRefunds.map((refund) => (
                  <tr key={refund.reservationId}>
                    <td>{refund.requestedAt ? new Date(refund.requestedAt).toLocaleString("ko-KR") : "-"}</td>
                    <td>{refund.reservationId}</td>
                    <td>{refund.siteName || refund.siteId}</td>
                    <td>{refund.status || "-"}</td>
                    <td title={refund.reason}>{truncate(refund.reason, 30)}</td>
                    <td>
                      <button
                        type="button"
                        className="dc-btn dc-btn-outline"
                        onClick={() =>
                          onSelectReservation?.({ reservationId: refund.reservationId })
                        }
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="dc-status-text">데이터 없음</p>
          )}
        </div>
      </div>
      {loading && <p className="dc-status-text">불러오는 중...</p>}
    </div>
  );
}
