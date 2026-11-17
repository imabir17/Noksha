"use client";

import React, { useState } from "react";
import { PROMO_CODES } from "@/data/nokshaData";
import { PromoRule } from "@/lib/pricing";

interface PromoFieldProps {
  promo: string | null;
  onPromo: (code: string | null) => void;
  promoRules?: PromoRule[];
}

/** Courtesy-code entry shared by the bag drawer and the checkout summary. */
export default function PromoField({ promo, onPromo, promoRules }: PromoFieldProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  if (promo) {
    const matched = promoRules?.find((p) => p.code.toUpperCase() === promo.toUpperCase());
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-river">
          Courtesy applied — {promo}
          {matched?.label ? ` (${matched.label})` : ""}
        </span>
        <button
          type="button"
          onClick={() => onPromo(null)}
          className="nav-link eyebrow !text-[0.58rem] text-mute cursor-pointer"
        >
          Remove
        </button>
      </div>
    );
  }

  const apply = () => {
    const c = code.trim().toUpperCase();
    const matched = promoRules?.find((p) => p.code.toUpperCase() === c && p.active !== false);
    if (matched || PROMO_CODES[c]) {
      onPromo(c);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div>
      <div className="flex items-end gap-4">
        <input
          className="field text-sm uppercase"
          placeholder="Courtesy code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          aria-label="Courtesy code"
        />
        <button
          type="button"
          onClick={apply}
          className="press eyebrow shrink-0 pb-3 cursor-pointer"
        >
          Apply
        </button>
      </div>
      {error && <p className="mt-3 text-xs text-alta">This code is not recognised.</p>}
    </div>
  );
}
