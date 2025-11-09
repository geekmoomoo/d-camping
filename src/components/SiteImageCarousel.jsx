import React, { useState, useEffect } from "react";

function SiteImageCarousel({ images }) {
  const valid = images && images.length ? images : [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (valid.length <= 1) return;
    const id = setInterval(() => {
      setIdx((p) => (p + 1) % valid.length);
    }, 2500);
    return () => clearInterval(id);
  }, [valid.length]);

  if (!valid.length) {
    return (
      <div className="dc-site-carousel">
        <div className="dc-hero-slide-empty">
          사이트 이미지를 등록해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="dc-site-carousel">
      {valid.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          className={"dc-site-img" + (i === idx ? " active" : "")}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      ))}
      <div className="dc-site-count">
        {idx + 1} / {valid.length}
      </div>
    </div>
  );
}

export default SiteImageCarousel;
