import React from "react";

function BannerModal({ banner, onClose }) {
  if (!banner) return null;

  return (
    <div
      className="banner-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="banner-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "12px",
          maxWidth: "420px",
          width: "90%",
          padding: "20px 18px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>
          {banner.title}
        </h2>

        {banner.subtitle && (
          <p
            style={{
              fontSize: "13px",
              color: "#777",
              marginBottom: "10px",
              whiteSpace: "pre-line",
            }}
          >
            {banner.subtitle}
          </p>
        )}

        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.5,
            whiteSpace: "pre-line",
          }}
        >
          {banner.content}
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "18px",
            width: "100%",
            padding: "10px 0",
            borderRadius: "8px",
            border: "none",
            background: "#2c3e50",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default BannerModal;
