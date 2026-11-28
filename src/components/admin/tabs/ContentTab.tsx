"use client";

import React, { useEffect, useState } from "react";
import SiteContentEditor from "../SiteContentEditor";
import { useAdmin } from "../hooks/useAdminData";
import { legacyCardCls, legacyInputCls } from "./_legacyShared";

export default function ContentTab() {
  const { data, postAction, notify } = useAdmin();
  const [contentDraft, setContentDraft] = useState<Record<string, string>>(
    () => data.siteContent || {}
  );

  useEffect(() => {
    setContentDraft(data.siteContent || {});
  }, [data.siteContent]);

  return (
    <SiteContentEditor
      contentDraft={contentDraft}
      setContentDraft={setContentDraft}
      onPublish={() =>
        postAction(
          { action: "save_content", content: contentDraft },
          "All site content & media published!"
        )
      }
      notify={(msg) => notify(msg)}
      inputCls={legacyInputCls}
      cardCls={legacyCardCls}
    />
  );
}
