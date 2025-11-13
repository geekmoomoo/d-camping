import React, { useState } from "react";
import SiteTypeButton from "./SiteTypeButton";

function MapReserveBox() {
  const [siteType, setSiteType] = useState("all");
  const [zone, setZone] = useState("");
  const [error, setError] = useState("");

  const zoneOptions = {
    "self-caravan": [
      "카라�?A�?(1~7�?",
      "카라�?B�?(8~14�?",
      "카라�?C�?(15~21�?",
    ],
    "cabana-deck": [
      "카바?�존 (1~4�?",
      "카바?�존 (5~8�?",
      "카바?�존 (9~12�?",
    ],
    tent: ["?�트 A�?(1~15�?", "?�트 B�?(16~30�?", "?�트 C�?(31~43�?"],
    pension: ["?�박??1~5??, "?�박??6~10??, "?�박??11~15??],
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (siteType === "all") {
      setError("?�용 ?�형???�택?�주?�요.");
      return;
    }
    if (!zone) {
      setError("지?�에???�하??구역???�택?�주?�요.");
      return;
    }
    console.log("지?�에???�택:", siteType, zone);
  };

  const handleReset = () => {
    setSiteType("all");
    setZone("");
    setError("");
  };

  const currentZones = siteType !== "all" ? zoneOptions[siteType] || [] : [];

  return (
    <form className="dc-qb dc-qb-map" onSubmit={handleSubmit}>
      <div className="dc-qb-header dc-qb-header-blue">
        <div className="dc-qb-title dc-qb-map-title">
          <span className="dc-qb-title-icon">?���?/span>
          지?�에???�택
        </div>
      </div>

      <div className="dc-qb-type-label">
        ?�용 ?�형
        <span className="dc-qb-type-tip">
          (?�???�택 ?? 지?�에??구역 ?�택)
        </span>
      </div>
      <div className="dc-qb-type-grid">
        <SiteTypeButton
          label="?��? 카라�?
          value="self-caravan"
          siteType={siteType}
          onChange={setSiteType}
          variant="blue"
        />
        <SiteTypeButton
          label="카바???�크"
          value="cabana-deck"
          siteType={siteType}
          onChange={setSiteType}
          variant="blue"
        />
        <SiteTypeButton
          label="?�트 ?�이??
          value="tent"
          siteType={siteType}
          onChange={setSiteType}
          variant="blue"
        />
        <SiteTypeButton
          label="?�박 ?�설"
          value="pension"
          siteType={siteType}
          onChange={setSiteType}
          variant="blue"
        />
      </div>

      <div className="dc-map-area">
        {siteType === "all" ? (
          <p className="dc-map-hint">
            ?�단?�서 ?�용 ?�형???�택?�면, ?�당 구역???�기?�서 ?�시?�니??
          </p>
        ) : (
          <>
            <div className="dc-map-label">?�택 가?�한 구역</div>
            <div className="dc-map-zones">
              {currentZones.map((z) => (
                <label
                  key={z}
                  className={"dc-map-zone" + (zone === z ? " active" : "")}
                >
                  <input
                    type="radio"
                    name="map-zone"
                    value={z}
                    checked={zone === z}
                    onChange={() => setZone(z)}
                  />
                  <span>{z}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="dc-qb-actions dc-qb-actions-full">
        <button type="submit" className="dc-btn-primary dc-btn-map-primary">
          ?�음 ?�계�?진행
        </button>
        <button
          type="button"
          className="dc-btn-outline dc-btn-map-outline"
          onClick={handleReset}
        >
          초기??
        </button>
      </div>

      {error && <div className="dc-qb-error dc-qb-map-error">{error}</div>}
    </form>
  );
}
