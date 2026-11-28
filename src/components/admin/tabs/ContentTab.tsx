"use client";

import React, { useEffect, useState } from "react";
import SiteContentEditor from "../SiteContentEditor";
import { useAdmin } from "../hooks/useAdminData";

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
      savedContent={data.siteContent || {}}
      setContentDraft={setContentDraft}
      onDiscard={() => setContentDraft(data.siteContent || {})}
      onPublish={() =>
        postAction(
          { action: "save_content", content: contentDraft },
          "Published site content & media"
        )
      }
      notify={(msg) => notify(msg)}
    />
  );
}
