import React, { useState } from "react";
import SiteTypeButton from "./SiteTypeButton";

function MapReserveBox() {
  const [siteType, setSiteType] = useState("all");
  const [zone, setZone] = useState("");
  const [error, setError] = useState("");

  const zoneOptions = {
    "self-caravan": [
      "카라반 A존 (1~7번)",
      "카라반 B존 (8~14번)",
      "카라반 C존 (15~21번)",
    ],
    "cabana-deck": [
      "카바나존 (1~4번)",
      "카바나존 (5~8번)",
      "카바나존 (9~12번)",
    ],
    tent: ["텐트 A존 (1~15번)", "텐트 B존 (16~30번)", "텐트 C존 (31~43번)"],
    lodging: ["숙박동 1~5동", "숙박동 6~10동", "숙박동 11~15동"],
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (siteType === "all") {
      setError("이용 유형을 선택해주세요.");
      return;
    }
    if (!zone) {
      setError("지도에서 원하는 구역을 선택해주세요.");
      return;
    }
    console.log("지도에서 선택:", siteType, zone);
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
        <div className="dc-qb-title dc-qb-map-title">🗺️ 지도에서 선택</div>
      </div>

      <div className="dc-qb-type-label">
        이용 유형
        <span className="dc-qb-type-tip">
          (타입 선택 후, 지도에서 구역 선택)
        </span>
      </div>
      <div className="dc-qb-type-grid">
        <SiteTypeButton
          label="자가 카라반"
          value="self-caravan"
          siteType={siteType}
          onChange={setSiteType}
          variant="blue"
        />
        <SiteTypeButton
          label="카바나 데크"
          value="cabana-deck"
          siteType={siteType}
          onChange={setSiteType}
          variant="blue"
        />
        <SiteTypeButton
          label="텐트 사이트"
          value="tent"
          siteType={siteType}
          onChange={setSiteType}
          variant="blue"
        />
        <SiteTypeButton
          label="숙박 시설"
          value="lodging"
          siteType={siteType}
          onChange={setSiteType}
          variant="blue"
        />
      </div>

      <div className="dc-map-area">
        {siteType === "all" ? (
          <p className="dc-map-hint">
            상단에서 이용 유형을 선택하면, 해당 구역이 여기에서 표시됩니다.
          </p>
        ) : (
          <>
            <div className="dc-map-label">선택 가능한 구역</div>
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
          다음 단계로 진행
        </button>
        <button
          type="button"
          className="dc-btn-outline dc-btn-map-outline"
          onClick={handleReset}
        >
          초기화
        </button>
      </div>

      {error && <div className="dc-qb-error dc-qb-map-error">{error}</div>}
    </form>
  );
}

export default MapReserveBox;
