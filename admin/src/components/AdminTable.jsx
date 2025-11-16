import React from "react";

export default function AdminTable({ columns, data, onAction }) {
  return (
    <div className="dc-table-wrap">
      <table className="dc-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {onAction && <th>관리</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.reservationId || row.id}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key] ?? "-"}
                </td>
              ))}
              {onAction && (
                <td>
                  <button
                    type="button"
                    className="dc-btn dc-btn-outline"
                    onClick={() => onAction(row)}
                  >
                    상세보기
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
